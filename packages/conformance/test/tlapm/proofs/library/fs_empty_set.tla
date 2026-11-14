(*---
description: SMT uses FS_EmptySet of FiniteSetTheorems to prove that {} is finite with cardinality 0.
ref: library/FiniteSetTheorems.tla#FS_EmptySet
mode: proof
outcome: proved
---*)
---- MODULE fs_empty_set ----
EXTENDS FiniteSets, FiniteSetTheorems, TLAPS
THEOREM IsFiniteSet({}) /\ Cardinality({}) = 0
  BY FS_EmptySet, SMT
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
    @loc: 10:6:10:17
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:19:10:22
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:19:10:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./fs_empty_set.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
