# Holiday Schema Directory

This document provides an overview of everything that goes into December.

## [Activity](../src/lib/schemas/activity.ts)

An `Activity` is something that someone wants to do. Here are the attributes that define it:

- `title`: What would you shout up the stairs to let everybody know it's time to start the activity?
- `description`: What exactly IS this activity, anyway? How would you describe it to someone?
- `category`: What type of activity is this? How does it fit into an informational hierarchy when compared to other activities?
- `date`: Does this activity fall on a specific day?
- `location`: Where do we have to go to do this?
  - `name`: What do we call the place?
  - `address`: Where in the world is it?
  - `url`: Where on the internet is it?
- `durationMinutes`: Exactly how long is this going to last, anyway?
- `estimatedCostDollars`: How much is this going to set us back on our revenue goals for the year?
- `estimatedMemberCostDollars`: How much is this going to set us back if we're members?
- `participants`: Who are you roping into this?
- `advanceSteps`: What needs to get done ahead of time to make this activity possible?
  - `title`: What has to get done?
  - `description`: What has to get done, but with more words?
  - `daysBefore`: How many days before the activity does this have to get done?
- `checklist`: Are there any sub-components of the activity that deserve to be tracked in isolation.
- `variants`: What are the different ways we could do this? Each one is a [variant](#variant).
- `traditionLevel`: How important is this activity, on a scale of 0 to 5, in terms of desired routine frequency over a person's life.
- `phases`: In which phase(s) of `december` would it be acceptable to hold this activity?
- `sweetSpot`: What's the ideal proximity to a particular date?
  - `relativeTo`: The date that defines the sweet spot range.
  - `fromDays`: The earliest day, relative to the central date, that it would still be OK to do this activity.
  - `toDays`: The latest day, relative to the central date, that it would still be OK to do this activity.
- `narrowlyScheduled`: Does this only happen on a single day or weekend, rather than whenever we choose?

## [Variant](../src/lib/schemas/variant.ts)

One way to do an [activity](#activity) that can be done more than one way, such as somewhere else or for a different price.

- `name`: What do we call this version of the activity?
- `description`: What makes this version different?
- `location`: Where do we have to go to do it this way? A [location](#location).
- `estimatedCostDollars`: How much does doing it this way set us back?
- `estimatedMemberCostDollars`: How much does doing it this way set us back if we're members?

## [Shopping Location](../src/lib/schemas/shopping-location.ts)

We do be buying things. A shopping location is a [location](#location) with one more attribute:

- `goFor`: A description of what we usually try to buy here.

## [Location](../src/lib/schemas/location.ts)

A place we go, for an activity, a variant, or to shop.

- `name`: What we call the place.
- `address`: Where in the world is it?
- `url`: Where on the internet is it?

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
