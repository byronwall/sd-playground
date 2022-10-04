import { isEqual } from 'lodash-es';
import {
  Button,
  CopyButton,
  Group,
  JsonInput,
  MultiSelect,
  NumberInput,
  Popover,
  Radio,
  Stack,
  Switch,
  Table,
  Title,
} from '@mantine/core';
import {
  findImageDifferences,
  generatePlaceholderForTransforms,
  getTextForBreakdown,
  PromptBreakdown,
  SdImage,
  SdImagePlaceHolder,
  summarizeAllDifferences,
} from '@sd-playground/shared-types';

import { useState } from 'react';
import { useQuery } from 'react-query';

import { artists } from '../model/choices';
import { ImageTransformHolder } from '../model/transformers';
import { ImageTransformChooser } from './ImageTransformChooser';
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

const variableChoices = ['cfg', 'seed', 'steps', 'artist'];

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

  const mainImage: SdImage = data?.[0] ?? ({} as SdImage);

  console.log('mainImage', mainImage);

  // store a pair of trnasform hodlers in state
  const [transformRow, setTransformRow] =
    useState<ImageTransformHolder>(undefined);

  const [transformCol, setTransformCol] =
    useState<ImageTransformHolder>(undefined);

  // take those images and push into a table -- by default 3x3 with single image in center

  // this is an array of arrays
  // this will eventually by built by checking the CFG or prompt or other details

  const [rowCount, setRowCount] = useState(3);
  const [colCount, setColCount] = useState(3);

  const [showAllCfgs, setShowAllCfgs] = useState(true);
  const [showAllSeeds, setShowAllSeeds] = useState(true);
  const [showAllSteps, setShowAllSteps] = useState(true);
  const [showAllArtists, setShowAllArtists] = useState(true);

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
  const [artistChoice, setArtistChoice] = useState<string[]>([]);

  // track bools to enable the auto gen for row/col
  const [autoGenRow, setAutoGenRow] = useState(false);
  const [autoGenCol, setAutoGenCol] = useState(false);

  const delta: { [E in keyof SdImagePlaceHolder]: number | undefined } = {
    cfg: cfgDelta,
    seed: seedDelta,
    steps: stepsDelta,
    promptBreakdown: undefined,
    groupId: undefined,
  };

  const middleRow = Math.floor(rowCount / 2);
  const middleCol = Math.floor(colCount / 2);

  const visibleIds: string[] = [];

  const showAllMap = {
    seed: showAllSeeds,
    cfg: showAllCfgs,
    steps: showAllSteps,
    artist: showAllArtists,
  };
  // map grid types to col var
  const colShowAll = showAllMap[colVar];
  const rowShowAll = showAllMap[rowVar];

  // build the col headers
  let colHeaders = [];
  if (colShowAll) {
    colHeaders = uniq(
      data?.map((d) =>
        colVar === 'artist' ? getArtist(d.promptBreakdown) : d[colVar]
      )
    );
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
    rowHeaders = uniq(
      data?.map((d) =>
        rowVar === 'artist' ? getArtist(d.promptBreakdown) : d[rowVar]
      )
    );
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
    artist: artistChoice,
  };

  extraChoiceMap[colVar].forEach((c) =>
    colHeaders.push(colVar === 'artist' ? c : +c)
  );
  extraChoiceMap[rowVar].forEach((c) =>
    rowHeaders.push(rowVar === 'artist' ? c : +c)
  );

  // make sure they are unique
  colHeaders = uniq(colHeaders);
  rowHeaders = uniq(rowHeaders);

  colHeaders.sort((a, b) => a - b);
  rowHeaders.sort((a, b) => a - b);

  // generate placeholders from row/col transforms

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

        const found = data?.find((item) => {
          return (
            isEqual(item.promptBreakdown, placeholder.promptBreakdown) &&
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
  }

  console.log('tableData', tableData);

  const [imageSize, setImageSize] = useState(200);

  return (
    <div>
      <Title order={1}>grid of images</Title>
      <Title order={2}>transform chooser</Title>
      <Stack>
        <ImageTransformChooser
          holder={transformRow}
          onChange={setTransformRow}
        />
        <ImageTransformChooser
          holder={transformCol}
          onChange={setTransformCol}
        />
      </Stack>
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

          <MultiSelect
            label="artist"
            data={artistChoices}
            value={artistChoice}
            onChange={setArtistChoice}
            clearable
            searchable
          />
        </Group>
      </Stack>

      <Stack>
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
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.map((item) => {
              const imgJson = JSON.stringify(item, null, 2);
              const baseDelta = findImageDifferences(mainImage, item, {
                shouldReportAddRemove: false,
              });
              const baseDeltaJson = JSON.stringify(baseDelta, null, 2);
              return (
                <tr key={item.id}>
                  <td>
                    <SdImageComp image={item} size={150} />{' '}
                  </td>
                  <td>{getTextForBreakdown(item.promptBreakdown)}</td>
                  <td>{item.cfg}</td>
                  <td>{item.seed}</td>
                  <td>{item.steps}</td>
                  <td>
                    {visibleIds.find((c) => c === item.id) !== undefined
                      ? 'true'
                      : ''}
                  </td>
                  <td>
                    <Popover closeOnClickOutside>
                      <Popover.Dropdown>
                        <div style={{ width: 600 }}>
                          <b>JSON for image</b>
                          <CopyButton value={imgJson}>
                            {({ copied, copy }) => (
                              <Button
                                color={copied ? 'teal' : 'blue'}
                                onClick={copy}
                              >
                                {copied ? 'Copied url' : 'Copy url'}
                              </Button>
                            )}
                          </CopyButton>
                          <JsonInput value={imgJson} minRows={10} />
                        </div>
                      </Popover.Dropdown>
                      <Popover.Target>
                        <Button>JSON</Button>
                      </Popover.Target>
                    </Popover>
                  </td>
                  <td>
                    <Popover closeOnClickOutside>
                      <Popover.Dropdown>
                        <div style={{ width: 600 }}>
                          <b>JSON for image</b>
                          <CopyButton value={baseDeltaJson}>
                            {({ copied, copy }) => (
                              <Button
                                color={copied ? 'teal' : 'blue'}
                                onClick={copy}
                              >
                                {copied ? 'Copied url' : 'Copy url'}
                              </Button>
                            )}
                          </CopyButton>
                          <JsonInput
                            value={baseDeltaJson}
                            size="xl"
                            minRows={10}
                          />
                        </div>
                      </Popover.Dropdown>
                      <Popover.Target>
                        <Button>deltas</Button>
                      </Popover.Target>
                    </Popover>
                    <div>
                      {baseDelta.map((delta, idx) => (
                        <div key={idx}>{JSON.stringify(delta)}</div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <div>
          <Title order={4}>all differences</Title>
          <pre>
            {JSON.stringify(summarizeAllDifferences(mainImage, data), null, 2)}
          </pre>
        </div>
      </Stack>
    </div>
  );
}

function uniq(arr: any[]) {
  return [...new Set(arr)];
}

function adjustArtist(
  breakdown: PromptBreakdown,
  newArtist: string
): PromptBreakdown {
  // return orignal if arist is present
  const wasFound = breakdown.parts.find(
    (c) => c.label === 'artist' && c.text === newArtist
  );

  if (wasFound) {
    return breakdown;
  }
  const newBreakdown = { ...breakdown };

  // remove all artists -- and then add the new one
  const newParts = newBreakdown.parts.filter((c) => c.label !== 'artist');
  newParts.push({ label: 'artist', text: newArtist });

  newBreakdown.parts = newParts;
  return newBreakdown;
}

function getArtist(breakdown: PromptBreakdown): string {
  const artistPart = breakdown.parts.find((c) => c.label === 'artist');
  if (artistPart === undefined) {
    return '';
  }
  return artistPart.text;
}
