(*---
description: "A function on 1..n works as an argument to sequence operators."
ref: "tlc2/module/Sequences.java#Append"
flags: [expression]
outcome: success
---*)
---- MODULE function_in_seq_operators ----
EXTENDS Integers, Sequences, TLC
Test == Append([i \in 1..1 |-> 7], 8) = <<7, 8>> /\ ((1 :> 7) \o <<8>>) = <<7, 8>> /\ Head(1 :> 7) = 7
====

(*--- recorded
all:
  exit: 0
---*)
