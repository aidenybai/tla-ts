(*---
description: tlapm's own test unit/i_sequences/sequences_test.tla.
ref: test/unit/i_sequences/sequences_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE sequences_test ----

EXTENDS TLAPS, Sequences

(* NOTE Sequences are supported to the extent that the operators
    are declared in the result problem. No axioms for sequences
    are provided.
*)

Triv(x) == x = x

THEOREM ASSUME NEW S,
               NEW s,
               NEW t,
               NEW e,
               NEW m,
               NEW n,
               NEW Test(_),
               Triv(Seq(S)),
               Triv(Len(s)),
               Triv(s \o t),
               Triv(Append(s, e)),
               Triv(Head(s)),
               Triv(Tail(s)),
               Triv(SubSeq(s, m, n)),
               Triv(SelectSeq(s, Test))
        PROVE TRUE
    BY DEF Triv

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 36:5:36:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 36:5:36:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./sequences_test.tla", line 9, character 1 to line 38, character 4:
    [INFO]: All 1 obligation proved.
---*)
