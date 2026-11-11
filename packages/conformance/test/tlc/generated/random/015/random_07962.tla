(*---
description: Evaluates a random record expression, seed 262, number 7962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + ([x \in 1..2 |-> x])[0]] EXCEPT !.a = @ + (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) % (0 \div 0))] EXCEPT !.a = @ + ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (--1)]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 246 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 243.
    | ExtendableExpr starting at line 14, column 239.
    | Expression starting at line 14, column 239.
    | Except Spec starting at line 14, column 233.
    | Some [] Form starting at line 14, column 192.
    | Fatal errors while parsing TLA+ spec in file random_07962
    | In module random_07962
    | Could not parse module random_07962 from file random_07962.tla
    | *** Errors: 1
    | In module random_07962
    | Could not parse module random_07962 from file random_07962.tla
    3002:1 Parsing or semantic analysis failed.
---*)
