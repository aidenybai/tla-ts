(*---
description: "A set map's body is !(e)."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE set_map_body ----
Op == {<<x>> : x \in {1}}
Test == Op!1 = {1} /\ Op!(7) = <<7>>
====

(*--- recorded
all:
  exit: 0
---*)
