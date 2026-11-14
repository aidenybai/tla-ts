(*---
description: Zenon's regression test zenon/regression/features/test_case.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/features/test_case.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE test_case ----

THEOREM CASE TRUE -> TRUE
OBVIOUS

CONSTANT x, A, B, C

THEOREM
  ASSUME x = 1,
         1 # 2,
         A
  PROVE CASE x = 1 -> A
          [] x = 2 -> B
  OBVIOUS

THEOREM
  ASSUME x = 1,
         1 # 2,
         A
  PROVE CASE x = 1 -> A
          [] x = 2 -> B
          [] OTHER -> C
  OBVIOUS

====

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

    @type: obligation
    @id: 2
    @loc: 25:3:25:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 25:3:25:10
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 34:3:34:10
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 34:3:34:10
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./test_case.tla", line 12, character 1 to line 36, character 4:
    [INFO]: All 3 obligations proved.
---*)
