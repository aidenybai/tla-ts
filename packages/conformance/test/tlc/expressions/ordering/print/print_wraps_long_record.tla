(*---
description: "A long record wraps at field boundaries."
ref: "tlc2/pprint/PrettyPrint.java#mypp"
flags: [expression]
outcome: success
---*)
---- MODULE print_wraps_long_record ----
EXTENDS Integers, TLC
Test == PrintT([zaa |-> 1111111111, zbb |-> 1111111111, zcc |-> 1111111111, zdd |-> 1111111111, zee |-> 1111111111])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | [ zaa |-> 1111111111,
    |   zbb |-> 1111111111,
    |   zcc |-> 1111111111,
    |   zdd |-> 1111111111,
    |   zee |-> 1111111111 ]
---*)
