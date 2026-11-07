(*---
description: Evaluates a random bool expression, seed 262, number 5234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b8107 == IF (TRUE = [x \in 1..2 |-> x]) THEN ([a |-> 1, b |-> TRUE]).a ELSE (-1 % 0) IN (UNION {2..1, {}} \div CASE FALSE -> 2147483647 [] OTHER -> b8107) = CASE (DOMAIN <<1>> \subseteq DOMAIN <<5, 6>>) -> (LET b8108 == 3 IN b8108 - (CHOOSE b8109 \in SUBSET {1} : FALSE)) [] OTHER -> (IF <<5, 6>> THEN 3 ELSE 7 - Cardinality({1}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 110 to line 14, col 114 of module random_05234 and \div.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 116.
    | Expression starting at line 14, column 110.
    | ExtendableExpr starting at line 14, column 109.
    | Expression starting at line 14, column 109.
    | Case Other Arm starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_05234
    | In module random_05234
    | Could not parse module random_05234 from file random_05234.tla
    | *** Errors: 1
    | In module random_05234
    | Could not parse module random_05234 from file random_05234.tla
    3002:1 Parsing or semantic analysis failed.
---*)
