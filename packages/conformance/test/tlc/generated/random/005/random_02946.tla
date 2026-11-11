(*---
description: Evaluates a random seq expression, seed 262, number 2946.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02946 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = IF TRUE THEN 2 ELSE 3], ((CHOOSE b4667 \in {2, 1, 3} : FALSE) % LET b4668 == 2147483647 IN b4668)), CASE ((--1) < (2147483647 \div 2)) -> (Head(<<>>) - LET b4669 == 2 IN b4669) [] OTHER -> Cardinality({2147483647, FALSE}), (CHOOSE b4670 \in [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = ((1 :> 2))[1]] : (([a |-> 1]).a < (3 + 2)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 194 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 191.
    | Expression starting at line 14, column 191.
    | ExtendableExpr starting at line 14, column 190.
    | Expression starting at line 14, column 190.
    | Case Arm starting at line 14, column 190.
    | Fatal errors while parsing TLA+ spec in file random_02946
    | In module random_02946
    | Could not parse module random_02946 from file random_02946.tla
    | *** Errors: 1
    | In module random_02946
    | Could not parse module random_02946 from file random_02946.tla
    3002:1 Parsing or semantic analysis failed.
---*)
