import { Group, NumberInput, Radio } from '@mantine/core';
import { RadioGroup } from '@mantine/core/lib/Radio/RadioGroup/RadioGroup';
import { SdImage, SdImagePlaceHolder } from '@sd-playground/shared-types';
import { mainModule } from 'process';
import { useState } from 'react';
import { useQuery } from 'react-query';

import { SdImageComp } from './SdImageComp';
import { SdImagePlaceHolderComp } from './SdImagePlaceHolderComp';

interface ImageGridProps {
  id: string;
}

const __GridTypes = ['cfg-seed', 'cfg-steps', 'seed-steps'] as const;
type GridType = typeof __GridTypes[number];

const rowVars: { [E in GridType]: keyof SdImagePlaceHolder } = {
  'cfg-seed': 'cfg',
  'cfg-steps': 'cfg',
  'seed-steps': 'seed',
};

const colVars: { [E in GridType]: keyof SdImagePlaceHolder } = {
  'cfg-seed': 'seed',
  'cfg-steps': 'steps',
  'seed-steps': 'steps',
};

export function ImageGrid(props: ImageGridProps) {
  // des props
  const { id } = props;

  // create a query for 1 id
  const { data, isLoading, isError, error } = useQuery(id, async () => {
    const res = await fetch(
      `http://localhost:3333/api/images/group/${props.id}`
    );
    const results = (await res.json()) as SdImage[];
    return results;
  });

  // store grid type in state
  const [gridType, setGridType] = useState<GridType>('cfg-seed');

  console.log('all group images', data);

  const mainImage = data?.[0] ?? ({} as SdImagePlaceHolder);

  // take those images and push into a table -- by default 3x3 with single image in center

  // this is an array of arrays
  // this will eventually by built by checking the CFG or prompt or other details

  const [rowCount, setRowCount] = useState(3);
  const [colCount, setColCount] = useState(3);

  const tableData: Array<Array<SdImage | SdImagePlaceHolder>> = [];

  const rowVar = rowVars[gridType];
  const colVar = colVars[gridType];

  // store cfg delta size in state
  const [cfgDelta, setCfgDelta] = useState(1);
  const [seedDelta, setSeedDelta] = useState(10);
  const [stepsDelta, setStepsDelta] = useState(10);

  const delta: { [E in keyof SdImagePlaceHolder]: number | undefined } = {
    cfg: cfgDelta,
    seed: seedDelta,
    steps: stepsDelta,
    prompt: undefined,
    groupId: undefined,
  };

  const middleRow = Math.floor(rowCount / 2);
  const middleCol = Math.floor(colCount / 2);

  // iterate over the rows and cols
  for (let row = 0; row < rowCount; row++) {
    // create a new row

    tableData.push([]);

    for (let col = 0; col < colCount; col++) {
      // settings for this item
      const placeholder = {
        prompt: mainImage.prompt,
        groupId: mainImage.groupId,
        cfg: mainImage.cfg,
        seed: mainImage.seed,
        steps: mainImage.steps,
        [rowVar]: +mainImage[rowVar] + (row - middleRow) * (delta[rowVar] ?? 0),
        [colVar]: +mainImage[colVar] + (col - middleCol) * (delta[colVar] ?? 0),
      } as SdImagePlaceHolder;

      // search through group to see if item exists

      const found = data?.find((item) => {
        return (
          item.prompt === placeholder.prompt &&
          item.cfg === placeholder.cfg &&
          item.seed === placeholder.seed &&
          item.steps === placeholder.steps
        );
      });

      tableData[row][col] = found ?? placeholder;
    }
  }

  console.log('tableData', tableData);

  const [imageSize, setImageSize] = useState(200);

  return (
    <div>
      <h1>ImageGrid</h1>
      <Radio.Group value={gridType} onChange={setGridType}>
        <Radio value={__GridTypes[0]} label={__GridTypes[0]} />
        <Radio value={__GridTypes[1]} label={__GridTypes[1]} />
        <Radio value={__GridTypes[2]} label={__GridTypes[2]} />
      </Radio.Group>
      <div> {isLoading ? 'loading...' : ''} </div>
      <div> {isError ? 'error' : ''} </div>
      <Group>
        <NumberInput value={rowCount} onChange={setRowCount} />
        <NumberInput value={colCount} onChange={setColCount} />
        <NumberInput value={imageSize} onChange={setImageSize} />
      </Group>

      <Group title="deltas">
        <NumberInput value={cfgDelta} onChange={setCfgDelta} />
        <NumberInput value={seedDelta} onChange={setSeedDelta} />
        <NumberInput value={stepsDelta} onChange={setStepsDelta} />
      </Group>

      <div style={{ display: 'inline-flex' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            gap: 10,
            gridAutoRows: 'minmax(100px, auto)',
          }}
        >
          {tableData.flat().map((cell, rowIdx) => {
            if (cell === undefined) {
              return <div key={rowIdx} />;
            }
            if (!('id' in cell)) {
              return (
                <SdImagePlaceHolderComp
                  key={rowIdx}
                  size={imageSize}
                  placeholder={cell}
                />
              );
            }
            return (
              <div key={cell?.id ?? rowIdx}>
                <SdImageComp image={cell} size={imageSize} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
