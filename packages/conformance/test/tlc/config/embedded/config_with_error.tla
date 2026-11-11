(*---
description: A CFG error inside a block uses the same message and exit status as in a file.
ref: util/MonolithSpecExtractor.java#config
outcome: config-error
args:
  - -config
  - config_with_error.tla
---*)
---- MODULE config_with_error ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====
---- CONFIG config_with_error ----
INIT
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5003:1 TLC found an error in the configuration file at line 1
    The keyword INIT was not followed by an identifier.
---*)
