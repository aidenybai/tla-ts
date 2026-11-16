(*---
description: Keys mapped to one image add their counts.
ref: tlc2/module/Bags.java#BagOfAll
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_of_all_merges ----
EXTENDS Bags, TLC, Naturals
Test == BagOfAll(LAMBDA x : x % 2, 1 :> 1 @@ 2 :> 2 @@ 3 :> 3) = (1 :> 4 @@ 0 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
