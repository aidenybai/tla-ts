(*---
description: Evaluates a random int expression, seed 262, number 9857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE) EXCEPT ![(CHOOSE b15306 \in (7 :> -1) : (3 \in {1}))] = Len((<<1, 2>> \o <<>>))])[CASE ((2147483647 % 2) = ([a |-> 1, b |-> TRUE]).a) -> IF (FALSE => FALSE) THEN (0 \div -1) ELSE (CHOOSE b15307 \in {x \in 1..3 : x > 1} : TRUE) [] OTHER -> Cardinality({b15308 \in Nat : TRUE})])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 233 to line 14, col 236 of module random_09857 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 231.
    | Expression starting at line 14, column 231.
    | ExtendableExpr starting at line 14, column 230.
    | Expression starting at line 14, column 230.
    | IF THEN ELSE starting at line 14, column 205.
    | Fatal errors while parsing TLA+ spec in file random_09857
    | In module random_09857
    | Could not parse module random_09857 from file random_09857.tla
    | *** Errors: 1
    | In module random_09857
    | Could not parse module random_09857 from file random_09857.tla
    3002:1 Parsing or semantic analysis failed.
---*)
