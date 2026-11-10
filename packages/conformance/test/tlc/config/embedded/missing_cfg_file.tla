(*---
description: -config naming a file that doesn't exist reports a read error and exits 151.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT Init
  NEXT Next
args:
  - -config
  - absent_file
---*)
---- MODULE missing_cfg_file ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5001:1 TLC encountered the following error when trying to read the configuration file absent_file.cfg:
    File not found.
---*)
