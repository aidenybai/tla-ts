(*---
description: Evaluates a random bool expression, seed 262, number 872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((-3) % (1 % 0)) :> DOMAIN [{2, 1, 3} EXCEPT ![[a |-> 1, b |-> TRUE]] = 0]) EXCEPT ![CASE (([x \in 1..2 |-> x])[-1] \in (2..1 \cup Nat)) -> ((7 - 1) + [b1413 \in {1, 2} |-> 2]) [] OTHER -> ((--1) \div (-1 \div [x \in Nat |-> x + 1]))] = ([(<<5, 6>> @@ [a |-> 1]) EXCEPT ![IF 7 THEN 2147483647 ELSE 7] = Len(<<3, 1, 2>>)])[([[a |-> 1] EXCEPT !.a = @ + (1 :> 2)]).a]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 211 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 208.
    | Expression starting at line 14, column 208.
    | ExtendableExpr starting at line 14, column 207.
    | Expression starting at line 14, column 207.
    | Case Other Arm starting at line 14, column 198.
    | Fatal errors while parsing TLA+ spec in file random_00872
    | In module random_00872
    | Could not parse module random_00872 from file random_00872.tla
    | *** Errors: 1
    | In module random_00872
    | Could not parse module random_00872 from file random_00872.tla
    3002:1 Parsing or semantic analysis failed.
---*)
