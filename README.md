# Sly Migrations

[![Build Status](https://travis-ci.org/intellect-collective/sly-migrations.svg?branch=master)](https://travis-ci.org/intellect-collective/sly-migrations) [![Coverage Status](https://coveralls.io/repos/github/intellect-collective/sly-migrations/badge.svg?branch=master)](https://coveralls.io/github/intellect-collective/sly-migrations?branch=master) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/6434abcf01894fa99b25135897f57b86)](https://www.codacy.com/app/thomas-w/sly-migrations?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=intellect-collective/sly-migrations&amp;utm_campaign=Badge_Grade)

Flexible datastore schema migrations for NodeJS environments.

## Overview

Sly is fairly agnostic as it concerns the underlying datastore being migrated. You can migrate Mongo, or Postgres, or Oracle, or Cassandra, or whatever.
You don't strictly need to keep track of which migrations have passed and which have failed. If you don't, _all_ migrations will _always_ run. If you do, then you can run migrations incrementally.

## Install

```
npm install --save-dev sly-migrations
```

... more docs to come ...