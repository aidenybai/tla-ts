(*---
description: SMT uses the first-order LenProperties theorem of SequenceTheorems as a quantified hypothesis.
ref: library/SequenceTheorems.tla#LenProperties
mode: proof
outcome: proved
---*)
---- MODULE seq_len_properties ----
EXTENDS Sequences, SequenceTheorems, TLAPS
THEOREM ASSUME NEW S, NEW s \in Seq(S) PROVE DOMAIN s = 1..Len(s)
  BY LenProperties, SMT
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

    File "./seq_len_properties.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
