(*---
description: "A filter binder over a Reducible set does not check tuple length, so a longer tuple is accepted and its extra component ignored. TLC should report a mismatch here, as the lazy path does."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
features: [tlc-bug]
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_reducible_ignores_extra_components ----
EXTENDS Integers
Test == {<<a, b>> \in {<<1, 2, 3>>} : a < b} = {<<1, 2, 3>>}
====

(*--- recorded
all:
  exit: 0
---*)
