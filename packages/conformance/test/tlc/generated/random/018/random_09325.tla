(*---
description: Evaluates a random record expression, seed 262, number 9325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))] EXCEPT !.a = @ + CASE (({} \cap 1..3) = ({} \cap {x \in 1..3 : x > 1})) -> ((-3) * IF TRUE THEN 1 ELSE 0) [] OTHER -> ((2 :> 7))[(--1)]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 245 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 242.
    | Expression starting at line 14, column 242.
    | Some [] Form starting at line 14, column 241.
    | ExtendableExpr starting at line 14, column 231.
    | Expression starting at line 14, column 231.
    | Fatal errors while parsing TLA+ spec in file random_09325
    | In module random_09325
    | Could not parse module random_09325 from file random_09325.tla
    | *** Errors: 1
    | In module random_09325
    | Could not parse module random_09325 from file random_09325.tla
    3002:1 Parsing or semantic analysis failed.
---*)
