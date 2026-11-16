(*---
description: Zenon's regression test zenon/regression/misc/test4.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/misc/test4.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
------------------ MODULE test4 -----------------

CONSTANT flag

ASSUME thm == flag = 1

THEOREM \A a : a = 1 => a = flag
BY thm



================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 19:1:19:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 19:1:19:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 19:4:19:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 19:4:19:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./test4.tla", line 12, character 1 to line 23, character 48:
    [INFO]: All 2 obligations proved.
---*)
