(*---
description: A -config file that doesn't exist exits 151 with a read error naming it.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
args:
  - -config
  - no_such_file.cfg
---*)
---- MODULE missing_explicit ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5001:1 TLC encountered the following error when trying to read the configuration file no_such_file.cfg:
    File not found.
---*)
