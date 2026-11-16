(*---
description: "{e : x \\in {}} never evaluates e."
ref: "tlc2/tool/impl/Tool.java#OPCODE_soa"
flags: [expression]
outcome: success
---*)
---- MODULE empty_domain_skips_body ----
EXTENDS Integers
Test == {1 \div 0 : x \in {}} = {}
====

(*--- recorded
all:
  exit: 0
---*)
