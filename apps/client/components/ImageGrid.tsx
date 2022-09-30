import {
  Group,
  MultiSelect,
  NumberInput,
  Radio,
  Stack,
  Switch,
  Table,
  Title,
} from '@mantine/core';
import { SdImage, SdImagePlaceHolder } from '@sd-playground/shared-types';
import { useState } from 'react';
import { useQuery } from 'react-query';

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

const variableChoices = ['cfg', 'seed', 'steps'];

export function ImageGrid(props: ImageGridProps) {
  // des props
  const { groupId } = props;

  // create a query for 1 id
  const { data, isLoading, isError, error } = useQuery(groupId, async () => {
    const res = await fetch(
      `http://localhost:3333/api/images/group/${props.groupId}`
    );
    const results = (await res.json()) as SdImage[];
    return results;
  });

  const mainImage = data?.[0] ?? ({} as SdImagePlaceHolder);

  // take those images and push into a table -- by default 3x3 with single image in center

  // this is an array of arrays
  // this will eventually by built by checking the CFG or prompt or other details

  const [rowCount, setRowCount] = useState(3);
  const [colCount, setColCount] = useState(3);

  const [showAllCfgs, setShowAllCfgs] = useState(true);
  const [showAllSeeds, setShowAllSeeds] = useState(true);
  const [showAllSteps, setShowAllSteps] = useState(true);

  const tableData: Array<Array<SdImage | SdImagePlaceHolder>> = [];

  // store row and colVar in state
  const [rowVar, setRowVar] = useState('cfg');
  const [colVar, setColVar] = useState('seed');

  // store cfg delta size in state
  const [cfgDelta, setCfgDelta] = useState(2);
  const [seedDelta, setSeedDelta] = useState(10);
  const [stepsDelta, setStepsDelta] = useState(10);

  // store some cfg and step choices in state also
  const [cfgChoice, setCfgChoice] = useState<string[]>([]);
  const [stepsChoice, setStepsChoice] = useState<string[]>([]);
  const [seedChoice, setSeedChoice] = useState<string[]>([]);

  // track bools to enable the auto gen for row/col
  const [autoGenRow, setAutoGenRow] = useState(false);
  const [autoGenCol, setAutoGenCol] = useState(false);

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

  const showAllMap = {
    seed: showAllSeeds,
    cfg: showAllCfgs,
    steps: showAllSteps,
  };
  // map grid types to col var
  const colShowAll = showAllMap[colVar];
  const rowShowAll = showAllMap[rowVar];

  // build the col headers
  let colHeaders = [];
  if (colShowAll) {
    colHeaders = uniq(data?.map((d) => d[colVar]));
  } else if (autoGenCol) {
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
    rowHeaders = uniq(data?.map((d) => d[rowVar]));
  } else if (autoGenRow) {
    // build list from the row count
    for (let row = 0; row < rowCount; row++) {
      rowHeaders.push(
        +mainImage[rowVar] + (row - middleRow) * (delta[rowVar] ?? 0)
      );
    }
  }

  // add in the must show items from drop down
  const extraChoiceMap = {
    seed: seedChoice,
    cfg: cfgChoice,
    steps: stepsChoice,
  };

  extraChoiceMap[colVar].forEach((c) => colHeaders.push(+c));
  extraChoiceMap[rowVar].forEach((c) => rowHeaders.push(+c));

  // make sure they are unique
  colHeaders = uniq(colHeaders);
  rowHeaders = uniq(rowHeaders);

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

  const [imageSize, setImageSize] = useState(200);

  return (
    <div>
      <Title order={1}>grid of images</Title>
      <Group>
        <Radio.Group value={rowVar} onChange={setRowVar}>
          {variableChoices.map((choice) => (
            <Radio key={choice} value={choice} label={choice} />
          ))}
        </Radio.Group>
        {/* repeat for col var */}
        <Radio.Group value={colVar} onChange={setColVar}>
          {variableChoices.map((choice) => (
            <Radio key={choice} value={choice} label={choice} />
          ))}
        </Radio.Group>
      </Group>
      <div> {isLoading ? 'loading...' : ''} </div>
      <div> {isError ? 'error' : ''} </div>
      <Stack>
        <Group>
          <NumberInput label="size" value={imageSize} onChange={setImageSize} />
        </Group>
        <Group>
          <NumberInput label="rows" value={rowCount} onChange={setRowCount} />
          <Switch
            label="auto row"
            checked={autoGenRow}
            onChange={(evt) => setAutoGenRow(evt.currentTarget.checked)}
          />
          <NumberInput label="cols" value={colCount} onChange={setColCount} />
          <Switch
            label="auto col"
            checked={autoGenCol}
            onChange={(evt) => setAutoGenCol(evt.currentTarget.checked)}
          />
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
        <Group>
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
        </Group>
      </Stack>

      <Stack>
        {/* map tableData into table */}
        <Table>
          <thead>
            <tr>
              <th />
              {colHeaders.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>{rowHeaders[rowIndex]}</td>
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
                    <td key={cell?.id ?? colIndex}>
                      <SdImageComp image={cell} size={imageSize} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Stack>

      <Stack>
        <Title order={1}>all images in group</Title>
        <Table>
          <thead>
            <tr>
              <th>image</th>
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
                  <td>
                    <SdImageComp image={item} size={150} />{' '}
                  </td>
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
      </Stack>
    </div>
  );
}

function uniq(arr: any[]) {
  return [...new Set(arr)];
}
