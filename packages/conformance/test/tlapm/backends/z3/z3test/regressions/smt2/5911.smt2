(*---
description: z3test's regression regressions/smt2/5911.smt2.
ref: regressions/smt2/5911.smt2
features:
  - z3test
outcome: sat
---*)
(declare-const x Bool)
(declare-const x1 Bool)
(declare-fun ar () Bool)
(declare-fun var () Bool)
(declare-fun ar8 () (_ FloatingPoint 2 6))
(declare-fun r837 () (_ FloatingPoint 2 6))
(declare-fun r2 () Bool)
(declare-fun r13 () Bool)
(declare-fun r18 () Bool)
(declare-fun ar1 () Bool)
(declare-fun r7 () (_ BitVec 12))
(declare-fun r1 () (_ BitVec 13))
(declare-fun var1 () (_ BitVec 3))
(declare-fun r83 () (_ FloatingPoint 2 6))
(declare-fun r16 () Bool)
(declare-fun r15 () Bool)
(declare-fun r132 () (_ BitVec 3))
(declare-fun r29 () Real)
(declare-fun r88 () Bool)
(declare-fun va () Bool)
(declare-fun r8 () (_ FloatingPoint 2 6))
(declare-fun r () Bool)
(declare-fun v () Bool)
(declare-fun a () (_ BitVec 40))
(assert (or (= x1 va) (distinct ar8 (fp.sub RTZ r83 r837)) (distinct r7 (_ bv0 12)) (and x x1 (= a (_ bv0 40))) v (distinct (bvmul r1 r1) r1)))
(assert (or (or (= ar8 (fp.fma RTZ r83 r837 r8)) (not (= r13 x1)) (and r88 r2 (= ar1 (= 1 1)) (= r18 (is_int r29)))) (= r (ite r16 true x)) (= r132 (ite (not ar) (_ bv0 3) (ite var (_ bv0 3) (ite va (ite (or var r15) (_ bv0 3) (bvadd var1 (_ bv1 3))) (_ bv0 3)))))))
(check-sat-using (then aig qsat))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
