(*---
description: -recover from a directory with no checkpoint fails when the intern table is read.
ref: tlc2/TLC.java#process
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
features:
  - tlc-bug
args:
  - -recover
  - no_such_checkpoint
correct:
  all:
    exit: 255
    transcript: 1000:1 The directory no_such_checkpoint holds no checkpoint to recover from.
---*)
---- MODULE recover_missing_directory ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.io.FileNotFoundException
    : no_such_checkpoint/vars.chkpt (No such file or directory)
---*)
