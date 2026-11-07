(*---
description: A configuration of only comments is the same as an empty one, so a spec with variables has no initial predicate.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  \* nothing here
  (* nor here *)
---*)
---- MODULE comment_only_config ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
