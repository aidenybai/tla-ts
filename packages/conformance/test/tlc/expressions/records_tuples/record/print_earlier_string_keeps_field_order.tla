(*---
description: "A string literal does not move a field: the parser interns field names as it reads them but interns a string without its quotes only during semantic analysis, after the whole module is parsed."
ref: "tla2sany/semantic/StringNode.java#StringNode"
flags: [expression]
outcome: success
---*)
---- MODULE print_earlier_string_keeps_field_order ----
EXTENDS Integers, TLC
First == "zzp"
Test == PrintT([zzq |-> 1, zzp |-> 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [zzq |-> 1, zzp |-> 2]"
---*)
