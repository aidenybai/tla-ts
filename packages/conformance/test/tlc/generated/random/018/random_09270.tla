(*---
description: Evaluates a random bool expression, seed 262, number 9270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> 1..2] : TRUE) @@ ([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (7 - 3)] @@ [(<<5, 6>> @@ <<1>>) EXCEPT ![[[a |-> 1] EXCEPT !.a = 3]] = (--1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 176 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 173.
    | Expression starting at line 14, column 173.
    | Except Spec starting at line 14, column 141.
    | Some [] Form starting at line 14, column 113.
    | ExtendableExpr starting at line 14, column 113.
    | Fatal errors while parsing TLA+ spec in file random_09270
    | In module random_09270
    | Could not parse module random_09270 from file random_09270.tla
    | *** Errors: 1
    | In module random_09270
    | Could not parse module random_09270 from file random_09270.tla
    3002:1 Parsing or semantic analysis failed.
---*)
