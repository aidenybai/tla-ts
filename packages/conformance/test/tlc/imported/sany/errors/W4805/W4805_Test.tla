(*---
description: SANY reports W4805. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/W4805_Test.tla
features:
  - sany-errors
outcome: config-error
---*)
If the PlusCal algorithm's translation has been changed since the last time
the translation was run (as detected by the hash code) then raise a warning.
---- MODULE W4805_Test ----
(*
--algorithm Test {
  {
    lbl: skip;
  }
}
*)
\* BEGIN TRANSLATION (chksum(pcal) = "c0cb232" /\ chksum(tla) = "00000000")
VARIABLE pc

vars == << pc >>

Init == /\ pc = "lbl"

lbl == /\ pc = "lbl"
       /\ TRUE
       /\ pc' = "Done"

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == pc = "Done" /\ UNCHANGED vars

Next == lbl
           \/ Terminating

Spec == Init /\ [][Next]_vars

Termination == <>(pc = "Done")

\* END TRANSLATION 
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    | Warnings (1) during syntax parsing of W4805_Test:
    | In module W4805_Test
    | The TLA+ translation in module W4805_Test has changed since its last translation.
    2231:1 The configuration file did not specify the initial state predicate.
---*)
