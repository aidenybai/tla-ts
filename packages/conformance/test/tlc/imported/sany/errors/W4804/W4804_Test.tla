(*---
description: SANY reports W4804. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/W4804_Test.tla
features:
  - sany-errors
outcome: config-error
---*)
If the PlusCal algorithm but not its translation has changed since the last
time the translation was run (as detected by the hash code) then raise a
warning.
---- MODULE W4804_Test ----
(*
--algorithm Test {
  {
    lbl: skip;
  }
}
*)
\* BEGIN TRANSLATION (chksum(pcal) = "00000000" /\ chksum(tla) = "bff29291")
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
    | Warnings (1) during syntax parsing of W4804_Test:
    | In module W4804_Test
    | The PlusCal algorithm in module W4804_Test has changed since its last translation.
    2231:1 The configuration file did not specify the initial state predicate.
---*)
