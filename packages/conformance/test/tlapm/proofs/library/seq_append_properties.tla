(*---
description: SMT uses AppendProperties to prove the length of an appended sequence.
ref: library/SequenceTheorems.tla#AppendProperties
mode: proof
outcome: proved
---*)
---- MODULE seq_append_properties ----
EXTENDS Sequences, SequenceTheorems, TLAPS
THEOREM ASSUME NEW S, NEW s \in Seq(S), NEW a \in S PROVE Append(s, a) \in Seq(S)
  BY AppendProperties, SMT
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
    @loc: 10:6:10:22
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:24:10:27
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:24:10:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./seq_append_properties.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
