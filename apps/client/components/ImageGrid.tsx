import {
  Group,
  MultiSelect,
  NumberInput,
  Radio,
  Stack,
  Table,
  Title,
} from '@mantine/core';
import { useListState } from '@mantine/hooks';
import {
  PromptBreakdownSortOrder,
  SdImage,
  SdImagePlaceHolder,
  SdImageTransform,
  SdImageTransformNumberRaw,
  SdImageTransformText,
  TransformNone,
} from '@sd-playground/shared-types';
import produce from 'immer';
import { uniq } from 'lodash-es';
import { useState } from 'react';
import { useQuery } from 'react-query';

import {
  generatePlaceholderForTransforms,
  isImageSameAsPlaceHolder,
  summarizeAllDifferences,
} from '../libs/helpers';
import { artists } from '../model/choices';
import { ImageTransformHolder } from '../model/transformers';
import { ImageTransformChooser } from './ImageTransformChooser';
import { SdGroupTable } from './SdGroupTable';
import { SdImageComp } from './SdImageComp';
import { SdImagePlaceHolderComp } from './SdImagePlaceHolderComp';

interface ImageGridProps {
  groupId: string;
}

// as value label pairs - 4 6 8 10 12 14
const cfgChoices = [
  { value: '4', label: '4' },
  { value: '6', label: '6' },
  { value: '8', label: '8' },
  { value: '10', label: '10' },
  { value: '12', label: '12' },
  { value: '14', label: '14' },
];

// store step choices -- 20 50
const stepsChoices = [
  { value: '20', label: '20' },
  { value: '50', label: '50' },
];

// store seed choices -- 123123 1321312 3123 32313 555 6879 109873
const seedChoices = [
  { value: '123123', label: '123123' },
  { value: '1321312', label: '1321312' },
  { value: '3123', label: '3123' },
  { value: '32313', label: '32313' },
  { value: '555', label: '555' },
  { value: '6879', label: '6879' },
  { value: '109873', label: '109873' },
];

const artistChoices = artists.map((c) => ({ value: 'by ' + c, label: c }));

const variableChoices = ['cfg', 'seed', 'steps', 'artist', 'loose', 'known'];

export function ImageGrid(props: ImageGridProps) {
  console.log('ImageGrid - render');

  // des props
  const { groupId } = props;

  // create a query for 1 id
  const {
    data: _data,
    isLoading,
    isError,
    error,
  } = useQuery(groupId, async () => {
    const res = await fetch(
      `http://localhost:3333/api/images/group/${props.groupId}`
    );
    const results = (await res.json()) as SdImage[];
    return results;
  });

  const data = _data ?? [];

  const mainImage: SdImage = data?.[0] ?? ({} as SdImage);

  console.log('mainImage', mainImage);

  const [transformRow, setTransformRow] =
    useState<ImageTransformHolder>(undefined);

  const [transformCol, setTransformCol] =
    useState<ImageTransformHolder>(undefined);

  // take those images and push into a table -- by default 3x3 with single image in center

  // this is an array of arrays
  // this will eventually by built by checking the CFG or prompt or other details

  // store row and colVar in state
  const [rowVar, setRowVar] = useState('cfg');
  const [colVar, setColVar] = useState('seed');

  // store some cfg and step choices in state also
  const [cfgChoice, setCfgChoice] = useState<string[]>([]);
  const [stepsChoice, setStepsChoice] = useState<string[]>([]);
  const [seedChoice, setSeedChoice] = useState<string[]>([]);
  const [artistChoice, setArtistChoice] = useState<string[]>([]);

  const visibleIds: string[] = [];

  // add in the must show items from drop down
  const extraChoiceMap = {
    seed: seedChoice,
    cfg: cfgChoice,
    steps: stepsChoice,
    artist: artistChoice,
    known: [],
  };

  const diffSummary = summarizeAllDifferences(mainImage, data);

  const [looseTransforms, setLooseTransforms] = useState<ImageTransformHolder>({
    name: 'loose',
    transforms: [TransformNone],
  });

  let rowTransformHolder: ImageTransformHolder;
  let colTransformHolder: ImageTransformHolder;

  switch (rowVar) {
    case 'cfg':
    case 'step':
    case 'artist':
    case 'seed': {
      // build the row headers
      let rowHeaders = diffSummary[rowVar] ?? [mainImage[rowVar]];
      extraChoiceMap[rowVar].forEach((c) =>
        rowHeaders.push(rowVar === 'artist' ? c : +c)
      );

      rowHeaders = uniq(rowHeaders);
      rowHeaders.sort((a, b) => a - b);

      rowTransformHolder = generateSimpleTransformHolder(
        'row simple',
        rowHeaders,
        rowVar
      );

      break;
    }
    case 'loose':
      rowTransformHolder = looseTransforms;
      break;

    case 'known':
      rowTransformHolder = transformRow;
      break;
  }

  switch (colVar) {
    case 'cfg':
    case 'step':
    case 'artist':
    case 'seed': {
      // build the col headers
      let colHeaders = diffSummary[colVar] ?? [mainImage[colVar]];

      extraChoiceMap[colVar].forEach((c) =>
        colHeaders.push(colVar === 'artist' ? c : +c)
      );

      // make sure they are unique
      colHeaders = uniq(colHeaders);

      colHeaders.sort((a, b) => a - b);

      // generate placeholders from row/col transforms

      colTransformHolder = generateSimpleTransformHolder(
        'col simple',
        colHeaders,
        colVar
      );
      break;
    }

    case 'loose':
      colTransformHolder = looseTransforms;
      break;

    case 'known':
      colTransformHolder = transformCol;
      break;
  }

  console.log('rowTransformHolder', { rowTransformHolder, colTransformHolder });

  const tableData = generateTableFromXform(
    rowTransformHolder,
    colTransformHolder,
    mainImage,
    data,
    visibleIds
  );

  const [imageSize, setImageSize] = useState(200);

  const handleAddLooseTransform = (t: SdImageTransform) => {
    setLooseTransforms(
      produce(looseTransforms, (draft) => {
        draft.transforms.push(t);
      })
    );
  };

  console.log('looseTransforms', looseTransforms);

  return (
    <div>
      <Title order={1}>grid of images</Title>
      <Title order={2}>transform chooser</Title>

      <Stack>
        <Group>
          <b>row var</b>
          <Radio.Group value={rowVar} onChange={setRowVar}>
            {variableChoices.map((choice) => (
              <Radio key={choice} value={choice} label={choice} />
            ))}
          </Radio.Group>

          <ImageTransformChooser
            holder={transformRow}
            onChange={setTransformRow}
            disabled={rowVar !== 'known'}
          />
        </Group>
        <Group>
          <b>col var</b>
          <Radio.Group value={colVar} onChange={setColVar}>
            {variableChoices.map((choice) => (
              <Radio key={choice} value={choice} label={choice} />
            ))}
          </Radio.Group>

          <ImageTransformChooser
            holder={transformCol}
            onChange={setTransformCol}
            disabled={colVar !== 'known'}
          />
        </Group>
      </Stack>
      <div> {isLoading ? 'loading...' : ''} </div>
      <div> {isError ? 'error' : ''} </div>
      <Stack>
        <Group>
          <NumberInput label="size" value={imageSize} onChange={setImageSize} />
        </Group>

        <Group>
          <b>extra choices</b>
          <MultiSelect
            label="cfg"
            data={cfgChoices}
            value={cfgChoice}
            onChange={setCfgChoice}
            clearable
            searchable
          />
          <MultiSelect
            label="steps"
            data={stepsChoices}
            value={stepsChoice}
            onChange={setStepsChoice}
            clearable
            searchable
          />

          <MultiSelect
            label="seed"
            data={seedChoices}
            value={seedChoice}
            onChange={setSeedChoice}
            clearable
            searchable
          />

          <MultiSelect
            label="artist"
            data={artistChoices}
            value={artistChoice}
            onChange={setArtistChoice}
            clearable
            searchable
          />
        </Group>

        <Table>
          <thead>
            <tr>
              <th />
              {colTransformHolder.transforms.map((col, idx) => (
                <th key={idx}>{col.type}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => {
              return (
                <tr key={rowIndex}>
                  <td>{rowTransformHolder.transforms[rowIndex].type}</td>

                  {row.map((cell, colIndex) => {
                    if (cell === undefined) {
                      return (
                        <td key={colIndex}>
                          <div />
                        </td>
                      );
                    }
                    if (!('id' in cell)) {
                      return (
                        <td key={colIndex}>
                          <SdImagePlaceHolderComp
                            size={imageSize}
                            placeholder={cell}
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={colIndex}>
                        <SdImageComp image={cell} size={imageSize} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Stack>

      <Stack>
        <Title order={1}>all images in group</Title>
        <SdGroupTable
          data={data}
          mainImage={mainImage}
          visibleItems={visibleIds}
          onNewTransform={handleAddLooseTransform}
        />
        <div>
          <Title order={4}>all differences</Title>
          <pre>{JSON.stringify(diffSummary, null, 2)}</pre>
        </div>
      </Stack>
    </div>
  );
}

function generateSimpleTransformHolder(
  name: string,
  uniqValues: any[],
  rowVar: string
) {
  const holder: ImageTransformHolder = {
    name,
    transforms: uniqValues.map((rowHeader) => {
      const rowTransformTemp = generateTransformFromSimplerHeader(
        rowVar,
        rowHeader
      );

      return rowTransformTemp;
    }),
  };

  return holder;
}

function generateTransformFromSimplerHeader(rowVar: string, rowHeader: any) {
  let rowTransformTemp: SdImageTransform;
  if (PromptBreakdownSortOrder.includes(rowVar as any)) {
    rowTransformTemp = {
      type: 'text',
      action: 'set',
      field: rowVar,
      value: rowHeader,
    } as SdImageTransformText;
  } else {
    rowTransformTemp = {
      type: 'num-raw',
      field: rowVar as any,
      value: rowHeader,
    } as SdImageTransformNumberRaw;
  }
  return rowTransformTemp;
}

type SdImageGrid = Array<Array<SdImage | SdImagePlaceHolder>>;

function generateTableFromXform(
  transformRow: ImageTransformHolder,
  transformCol: ImageTransformHolder,
  mainImage: SdImage,
  data: SdImage[],
  visibleIds: string[]
): SdImageGrid {
  const tableData: Array<Array<SdImage | SdImagePlaceHolder>> = [];
  if (transformRow && transformCol) {
    for (let row = 0; row < transformRow.transforms.length; row++) {
      const rowTransform = transformRow.transforms[row];
      const rowImages = [];
      tableData.push(rowImages);
      for (let col = 0; col < transformCol.transforms.length; col++) {
        const colTransform = transformCol.transforms[col];
        const placeholder = generatePlaceholderForTransforms(mainImage, [
          rowTransform,
          colTransform,
        ]);

        const found = data?.find((item) =>
          isImageSameAsPlaceHolder(item, placeholder)
        );

        if (found) {
          visibleIds.push(found.id);
        }

        tableData[row][col] = found ?? placeholder;
      }
    }
  }
  return tableData;
}
