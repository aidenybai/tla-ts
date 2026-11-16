(*---
description: SMT uses FS_AddElement to prove that adding an element keeps a set finite.
ref: library/FiniteSetTheorems.tla#FS_AddElement
mode: proof
outcome: proved
---*)
---- MODULE fs_add_element ----
EXTENDS FiniteSets, FiniteSetTheorems, TLAPS
THEOREM ASSUME NEW S, IsFiniteSet(S), NEW a PROVE IsFiniteSet(S \cup {a})
  BY FS_AddElement, SMT
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:21:10:24
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:21:10:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./fs_add_element.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
