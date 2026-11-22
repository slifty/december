# Holiday Schema Directory

This document provides an overview of everything that goes into December.

## [Activity](../src/lib/schemas/activity.ts)

An `Activity` is something that someone wants to do. Here are the attributes that define it:

- `title`: What would you shout up the stairs to let everybody know it's time to start the activity?
- `description`: What exactly IS this activity, anyway? How would you describe it to someone?
- `category`: What type of activity is this? How does it fit into an informational hierarchy when compared to other activities?
- `date`: Does this activity fall on a specific day?
- `durationMinutes`: Exactly how long is this going to last, anyway?
- `estimatedCostDollars`: How much is this going to set us back on our revenue goals for the year?
- `participants`: Who are you roping into this?
- `advanceSteps`: What needs to get done ahead of time to make this activity possible?
  - `title`: What has to get done?
  - `description`: What has to get done, but with more words?
  - `daysBefore`: How many days before the activity does this have to get done?
- `checklist`: Are there any sub-components of the activity that deserve to be tracked in isolation.
- `traditionLevel`: How important is this activity, on a scale of 0 to 5, in terms of desired routine frequency over a person's life.
- `phases`: In which phase(s) of `december` would it be acceptable to hold this activity?
- `sweetSpot`: What's the ideal proximity to a particular date?
  - `relativeTo`: The date that defines the sweet spot range.
  - `fromDays`: The earliest day, relative to the central date, that it would still be OK to do this activity.
  - `toDays`: The latest day, relative to the central date, that it would still be OK to do this activity.

## [Shopping Location](../src/lib/schemas/shopping-location.ts)

We do be buying things.

- `name`: A store we go to to buy things
- `goFor`: A description of what we usually try to buy here.
- `address`: Where in the world is this store?
- `url`: Where on the internet is this store?

## [Phase](../src/lib/schemas/phase.ts)

- `name`: The name of the seasonal phase
- `start`: The monthDay the seasonal phase starts
- `end`: The monthDay the seasonal phase ends

## [Category](../src/lib/schemas/category.ts)

What it takes to get to the activity.

- `home`: We don't have to drive anywhere.
- `indoor`: We have to drive somewhere, but we don't need to bundle up.
- `outdoor`: Bundle up for the cold.
- `movie`: Popcorn and a screen.
