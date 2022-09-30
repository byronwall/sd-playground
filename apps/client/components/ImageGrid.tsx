import { Group, NumberInput, Radio, Stack, Switch, Table } from '@mantine/core';
import { SdImage, SdImagePlaceHolder } from '@sd-playground/shared-types';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { useAppStore } from '../model/store';

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

  const loadCount = useAppStore((s) => s.loadCount);

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

  const [showAllCfgs, setShowAllCfgs] = useState(false);
  const [showAllSeeds, setShowAllSeeds] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const tableData: Array<Array<SdImage | SdImagePlaceHolder>> = [];

  const rowVar = rowVars[gridType];
  const colVar = colVars[gridType];

  // store cfg delta size in state
  const [cfgDelta, setCfgDelta] = useState(2);
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

  const visibleIds: string[] = [];

  // map grid types to col var
  const colShowAll = {
    'cfg-seed': showAllSeeds,
    'cfg-steps': showAllSteps,
    'seed-steps': showAllSteps,
  }[gridType];

  const rowShowAll = {
    'cfg-seed': showAllCfgs,
    'cfg-steps': showAllCfgs,
    'seed-steps': showAllSeeds,
  }[gridType];

  // build the col headers
  let colHeaders = [];
  if (colShowAll) {
    colHeaders = Array.from(new Set(data?.map((d) => d[colVar])));
  } else {
    // build list from the col count
    for (let col = 0; col < colCount; col++) {
      colHeaders.push(
        +mainImage[colVar] + (col - middleCol) * (delta[colVar] ?? 0)
      );
    }
  }

  // build the row headers
  let rowHeaders = [];
  if (rowShowAll) {
    rowHeaders = Array.from(new Set(data?.map((d) => d[rowVar])));
  } else {
    // build list from the row count
    for (let row = 0; row < rowCount; row++) {
      rowHeaders.push(
        +mainImage[rowVar] + (row - middleRow) * (delta[rowVar] ?? 0)
      );
    }
  }

  colHeaders.sort((a, b) => a - b);
  rowHeaders.sort((a, b) => a - b);

  // iterate over the rows and cols
  for (let row = 0; row < rowHeaders.length; row++) {
    // create a new row

    tableData.push([]);

    for (let col = 0; col < colHeaders.length; col++) {
      // settings for this item
      const placeholder = {
        prompt: mainImage.prompt,
        groupId: mainImage.groupId,
        cfg: mainImage.cfg,
        seed: mainImage.seed,
        steps: mainImage.steps,
        [rowVar]: rowHeaders[row],
        [colVar]: colHeaders[col],
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

      if (found) {
        visibleIds.push(found.id);
      }

      tableData[row][col] = found ?? placeholder;
    }
  }

  console.log('tableData', tableData);

  const [imageSize, setImageSize] = useState(200);

  const realColCount = colHeaders.length;
  const realRowCount = rowHeaders.length;

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
      <Stack>
        <Group>
          <NumberInput label="rows" value={rowCount} onChange={setRowCount} />
          <NumberInput label="cols" value={colCount} onChange={setColCount} />
          <NumberInput label="size" value={imageSize} onChange={setImageSize} />
        </Group>
        <Group title="deltas">
          <NumberInput label="d-cfg" value={cfgDelta} onChange={setCfgDelta} />
          <NumberInput
            label="d-seed"
            value={seedDelta}
            onChange={setSeedDelta}
          />
          <NumberInput
            label="d-steps"
            value={stepsDelta}
            onChange={setStepsDelta}
          />
        </Group>
        <Group>
          {/* build switches for teh show alls */}
          <Switch
            label="show all cfg"
            checked={showAllCfgs}
            onChange={(evt) => setShowAllCfgs(evt.currentTarget.checked)}
          />

          <Switch
            label="show all seed"
            checked={showAllSeeds}
            onChange={(evt) => setShowAllSeeds(evt.currentTarget.checked)}
          />

          <Switch
            label="show all steps"
            checked={showAllSteps}
            onChange={(evt) => setShowAllSteps(evt.currentTarget.checked)}
          />
        </Group>
      </Stack>

      <div style={{ display: 'inline-flex' }} key={loadCount}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${realColCount}, 1fr)`,
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

      <div>
        <h3>all images in group</h3>
        <Table>
          <thead>
            <tr>
              <th>prompt</th>
              <th>cfg</th>
              <th>seed</th>
              <th>steps</th>
              <th>visible</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((item) => {
              return (
                <tr key={item.id}>
                  <td>{item.prompt}</td>
                  <td>{item.cfg}</td>
                  <td>{item.seed}</td>
                  <td>{item.steps}</td>
                  <td>
                    {visibleIds.find((c) => c === item.id) !== undefined
                      ? 'true'
                      : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
