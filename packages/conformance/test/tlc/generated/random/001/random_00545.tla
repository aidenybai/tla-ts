(*---
description: Evaluates a random int expression, seed 262, number 545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (<<3, 1, 2>> = [x \in 1..2 |-> x]) -> (--1) [] OTHER -> [b927 \in {2, 1, 3} |-> b927] + ([b928 \in SUBSET {1} |-> 2..1])[(CHOOSE b929 \in {1, 2} : FALSE)]) - CASE ((\A b930 \in {} : TRUE) <=> ({2, 1, 3} \subseteq {1, 2})) -> CASE (<<3, 1, 2>> = [x \in Nat |-> x + 1]) -> Len(<<>>) [] OTHER -> LET b931 == -1 IN <<1>> [] OTHER -> (Cardinality(SUBSET {1}) \div [[a |-> 1] EXCEPT !.a = @ + 3])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 64 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | Case Arm starting at line 14, column 23.
    | CASE Expression starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_00545
    | In module random_00545
    | Could not parse module random_00545 from file random_00545.tla
    | *** Errors: 1
    | In module random_00545
    | Could not parse module random_00545 from file random_00545.tla
    3002:1 Parsing or semantic analysis failed.
---*)
