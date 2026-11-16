(*---
description: "A filter over {} never evaluates its predicate."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
flags: [expression]
outcome: success
---*)
---- MODULE empty_domain_skips_predicate ----
EXTENDS Integers
Test == {x \in {} : 1 \div 0 = 0} = {}
====

(*--- recorded
all:
  exit: 0
---*)
