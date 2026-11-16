(*---
description: SMT uses FS_Singleton to prove the cardinality of a singleton.
ref: library/FiniteSetTheorems.tla#FS_Singleton
mode: proof
outcome: proved
---*)
---- MODULE fs_singleton ----
EXTENDS FiniteSets, FiniteSetTheorems, TLAPS
THEOREM ASSUME NEW a PROVE Cardinality({a}) = 1
  BY FS_Singleton, SMT
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
    @loc: 10:6:10:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:20:10:23
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:20:10:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./fs_singleton.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
