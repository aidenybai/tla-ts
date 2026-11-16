(*---
description: TLCNoOp is the identity.
ref: tlc2/module/TLCExt.java#tlcNoOp
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE no_op_value ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCNoOp(1) = 1 /\ TLCNoOp({2, 1}) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
