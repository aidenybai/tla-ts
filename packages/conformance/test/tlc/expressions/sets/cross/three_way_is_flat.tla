(*---
description: "S \\X T \\X U is a set of triples rather than nested pairs."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cp"
flags: [expression]
outcome: success
---*)
---- MODULE three_way_is_flat ----
EXTENDS Integers
Test == {1} \X {2} \X {3} = {<<1, 2, 3>>}
====

(*--- recorded
all:
  exit: 0
---*)
