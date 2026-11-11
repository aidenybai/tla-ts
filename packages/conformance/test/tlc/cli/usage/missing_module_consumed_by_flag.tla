(*---
description: When a flag consumes the module argument as its value, no main file is left.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -config
  - missing_module_consumed_by_flag.cfg
  - -metadir
---*)
---- MODULE missing_module_consumed_by_flag ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Error: Missing input TLA+ module.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
