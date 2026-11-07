(*---
description: Zenon's regression test zenon/regression/misc/Bug1.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/misc/Bug1.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
------- MODULE Bug1 -----

THEOREM "a1" # "a2"
OBVIOUS

============================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:1:15:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 15:1:15:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./Bug1.tla", line 12, character 1 to line 17, character 44:
    [INFO]: All 1 obligation proved.
---*)
