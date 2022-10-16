# Changelog

## 2022-10-15 21:04:38

- Planned
  - Split into pages
  - Remove bad image groups
  - Move server to /api folder
  - Move all secrets into .env file for environment access

## 2022-10-15 00:23:01

- Move to supabase for the database -- pushed all existing images into database
  - This removes the need for sqlite
- Update stability client to resolve error

## 2022-10-06 21:31:55

- Rework image storage and access to use S3
- Resolve issue related to `steps` not working as a choice

## 2022-10-05 22:39:56

- Swap out the Python SDK for a JS one

## 2022-10-04 20:59:52

- Rework common libs to avoid importing lodash on the server
- Rework the transform system to change how the grid displays
- Allow a prompt to be quickly edited to produce transforms

## 2022-10-03 21:07:49

- Add ability to detect differences between images and groups of images
- Display those values in table -- will be used to drive the new grid interface

## 2022-10-02 23:10:56

- Rework the prompt modifier to use a set of transforms instead of directly editing properties

Next steps: allow for an existing prompt to be the basis of transforms; build an interface to show progressive updates to a prompt, improve logic on add prompt text and sync with labels, show those labels

## 2022-09-30 22:11:16

- Add a detailed prompt editor with various controls for quickly editing the prompt
- Add the ability to control and vary the artist in a prompt

## 2022-09-29 22:13:00

- Click on an image to show full size
- Much greater control over the grid display
- Move to HTML table instead of CSS grid
- Ensure that images are loaded as soon as possible
- Clean up logging calls
- Better visuals on the new prompt -- and allow the seed to be set
