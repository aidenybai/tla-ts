(*---
description: '--method ls4 sends obligations to LS4 by default.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', ls4]
outcome: proved
---*)
---- MODULE method_ls4 ----
VARIABLE x
THEOREM [](x = 1) => (x = 1)
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./method_ls4.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
