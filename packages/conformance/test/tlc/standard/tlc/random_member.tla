(*---
description: A chosen element is a member, for each branch of the switch.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_member ----
EXTENDS TLC, Naturals
Test == /\ RandomElement(1..9) \in 1..9
        /\ RandomElement({1, 2, 3}) \in {1, 2, 3}
        /\ RandomElement([{1, 2} -> {3, 4}]) \in [{1, 2} -> {3, 4}]
        /\ RandomElement([a : {1, 2}]) \in [a : {1, 2}]
        /\ RandomElement({1, 2} \X {3, 4}) \in {1, 2} \X {3, 4}
====

(*--- recorded
all:
  exit: 0
---*)
