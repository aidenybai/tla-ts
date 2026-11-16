(*---
description: tlapm's own test fast/enabled_cdot/NestedCdot_test.tla.
ref: test/fast/enabled_cdot/NestedCdot_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---------------------------- MODULE NestedCdot_test ----------------------------
(* Test proof directive `ExpandCdot` with nested occurrences of `\cdot`. *)
EXTENDS Naturals


Zenon == TRUE (*{ by (prover:"zenon") }*)
ExpandCdot == TRUE  (*{ by (prover:"expandcdot") }*)
AutoUSE == TRUE  (*{ by (prover:"autouse") }*)

--------------------------------------------------------------------------------

THEOREM
    ASSUME VARIABLE x
    PROVE (
        (x = 0 /\ x' = 1) \cdot (
            ((x = 1 /\ x' = 2) \cdot (x = 2 /\ x' = 3))  )
        )
        =
        ((x = 0 /\ x' = 1) \cdot (x = 1) /\ (x' = 3))
PROOF
BY ExpandCdot, Zenon


THEOREM
    ASSUME VARIABLE x
    PROVE (
        ((x = 0 /\ x' = 1) \cdot (x = 1) /\ (x' = 3)) )
        <=>
        ((x = 0) /\ (x' = 3))
PROOF
BY ExpandCdot, Zenon

--------------------------------------------------------------------------------
VARIABLE x


A == (x = 0 /\ x' = 1) \cdot (
    ((x = 1 /\ x' = 2) \cdot (x = 2 /\ x' = 3))  )


THEOREM  ((x = 0) /\ (x' = 3))  =>  A
PROOF
BY ExpandCdot, Zenon DEF A
--------------------------------------------------------------------------------

P == (x = 1 /\ x' = 2) \cdot (x = 2 /\ x' = 3)
Q == (x = 0 /\ x' = 1) \cdot P


THEOREM  ((x = 0) /\ (x' = 3))  =>  Q
PROOF
BY ExpandCdot, Zenon, AutoUSE DEF Q
================================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 29:1:29:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 29:1:29:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 29:4:29:14
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 29:4:29:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 29:16:29:21
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 29:16:29:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 39:1:39:3
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 39:1:39:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 39:4:39:14
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 39:4:39:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 39:16:39:21
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 39:16:39:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 51:1:51:3
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 51:1:51:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 8
    @loc: 51:4:51:14
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 51:4:51:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 51:16:51:21
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 51:16:51:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 60:1:60:3
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 60:1:60:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 11
    @loc: 60:4:60:14
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 60:4:60:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 12
    @loc: 60:16:60:21
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 60:16:60:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 13
    @loc: 60:23:60:30
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 60:23:60:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 13

    File "./NestedCdot_test.tla", line 55, character 30:
    [INFO]: Auto-expanding the definition of operator:  P
    File "./NestedCdot_test.tla", line 9, character 1 to line 61, character 80:
    [INFO]: All 13 obligations proved.
---*)
