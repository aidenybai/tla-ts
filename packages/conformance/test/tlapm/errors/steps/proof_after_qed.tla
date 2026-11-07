(*---
description: A leaf proof after a structured proof's QED is left over, so it is an extra step after the finished proof.
ref: src/proof/p_parser.ml#toplevel
mode: obligations
outcome: rejected
---*)
---- MODULE proof_after_qed ----
THEOREM TRUE
PROOF
<1> QED OBVIOUS
OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proof_after_qed.tla", line 11, characters 1-7

    extra step(s) after finished proof

    File "./proof_after_qed.tla", line 11, characters 1-7:
    Error: extra step(s) after finished proof
     tlapm ending abnormally with Failure("Proof.Parser.toplevel")
---*)
