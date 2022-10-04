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
  Table,
  Title,
} from '@mantine/core';
import {
  findImageDifferences,
  generatePlaceholderForTransforms,
  getTextForBreakdown,
  isImageSameAsPlaceHolder,
  PromptBreakdownSortOrder,
  SdImage,
  SdImagePlaceHolder,
  SdImageTransform,
  SdImageTransformNumberRaw,
  SdImageTransformText,
  summarizeAllDifferences,
} from '@sd-playground/shared-types';
import { uniq } from 'lodash-es';
import { useState } from 'react';
import { useQuery } from 'react-query';

import { artists } from '../model/choices';
import { ImageTransformHolder } from '../model/transformers';
import { ImageTransformChooser } from './ImageTransformChooser';
import { Switch } from './MantineWrappers';
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

  const [isFromXForm, setIsFromXForm] = useState<boolean>(false);

  // store row and colVar in state
  const [rowVar, setRowVar] = useState('cfg');
  const [colVar, setColVar] = useState('seed');

  // store some cfg and step choices in state also
  const [cfgChoice, setCfgChoice] = useState<string[]>([]);
  const [stepsChoice, setStepsChoice] = useState<string[]>([]);
  const [seedChoice, setSeedChoice] = useState<string[]>([]);
  const [artistChoice, setArtistChoice] = useState<string[]>([]);

  const visibleIds: string[] = [];

  const diffSummary = summarizeAllDifferences(mainImage, data);

  // build the col headers
  let colHeaders = diffSummary[colVar] ?? [mainImage[colVar]];

  // build the row headers
  let rowHeaders = diffSummary[rowVar] ?? [mainImage[rowVar]];

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

  const tableData = isFromXForm
    ? generateTableFromXform(
        transformRow,
        transformCol,
        mainImage,
        data,
        visibleIds
      )
    : generateTableDataFromChoices(
        rowHeaders,
        rowVar,
        colHeaders,
        colVar,
        mainImage,
        data,
        visibleIds
      );

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
      <Switch
        checked={isFromXForm}
        onChange={setIsFromXForm}
        label="should build grid from xform"
      />
      <Stack>
        <Group>
          <b>row var</b>
          <Radio.Group value={rowVar} onChange={setRowVar}>
            {variableChoices.map((choice) => (
              <Radio key={choice} value={choice} label={choice} />
            ))}
          </Radio.Group>
        </Group>
        <Group>
          <b>col var</b>
          <Radio.Group value={colVar} onChange={setColVar}>
            {variableChoices.map((choice) => (
              <Radio key={choice} value={choice} label={choice} />
            ))}
          </Radio.Group>
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
              {colHeaders.map((col) => (
                <th key={col}>{Array.isArray(col) ? col.join(' + ') : col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => {
              const rowHeader = rowHeaders[rowIndex];
              return (
                <tr key={rowIndex}>
                  <td>
                    {Array.isArray(rowHeader)
                      ? rowHeader.join(' + ')
                      : rowHeader}
                  </td>

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
              );
            })}
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
          <pre>{JSON.stringify(diffSummary, null, 2)}</pre>
        </div>
      </Stack>
    </div>
  );
}

function generateTableDataFromChoices(
  rowHeaders: any,
  rowVar: string,
  colHeaders: any,
  colVar: string,
  mainImage: SdImage,
  data: SdImage[],
  visibleIds: string[]
): SdImageGrid {
  const tableDataChoices = [];
  rowHeaders.map((rowHeader, row) => {
    tableDataChoices.push([]);

    const rowTransformTemp = generateTransformFromSimplerHeader(
      rowVar,
      rowHeader
    );

    colHeaders.map((colHeader, col) => {
      const colTransformTemp = generateTransformFromSimplerHeader(
        colVar,
        colHeader
      );

      const placeholder = generatePlaceholderForTransforms(mainImage, [
        rowTransformTemp,
        colTransformTemp,
      ]);

      const found = data.find((img) =>
        isImageSameAsPlaceHolder(img, placeholder)
      );

      if (found) {
        visibleIds.push(found.id);
      }

      tableDataChoices[row][col] = found ?? placeholder;
    });
  });
  return tableDataChoices;
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
