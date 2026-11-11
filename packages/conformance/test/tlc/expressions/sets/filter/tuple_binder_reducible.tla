(*---
description: "A filter over an enumerated set of pairs destructures its binder and keeps the original tuples."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_reducible ----
EXTENDS Integers
Test == {<<a, b>> \in {<<1, 2>>, <<2, 1>>} : a < b} = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 0
---*)
