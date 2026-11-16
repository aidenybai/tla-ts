(*---
description: z3test's regression regressions/smt2/5710.smt2.
ref: regressions/smt2/5710.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun PARAM4 () Int)
(declare-fun REG1.VALUE.BitWidth () Int)
(declare-fun REG1.VALUE.BitOffset () Int)
(declare-fun PARAM5 () Int)
(declare-fun REG2.VALUE.BitWidth () Int)
(declare-fun REG2.VALUE.BitOffset () Int)
(declare-fun PARAM1 () Int)
(declare-fun REG3.FD1.BitWidth () Int)
(declare-fun REG3.FD1.BitOffset () Int)
(declare-fun PARAM2 () Int)
(declare-fun REG3.FD2.BitWidth () Int)
(declare-fun REG3.FD2.BitOffset () Int)
(declare-fun PARAM3 () Int)
(declare-fun ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitWidth () Int)
(declare-fun ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitOffset () Int)
(assert (= REG1.VALUE.BitWidth PARAM4))
(assert (= REG1.VALUE.BitOffset 0))
(assert (>= REG1.VALUE.BitWidth 0))
(assert (<= REG1.VALUE.BitWidth 32))
(assert (<= (+ REG1.VALUE.BitOffset REG1.VALUE.BitWidth) 32))
(assert (= REG2.VALUE.BitWidth PARAM5))
(assert (= REG2.VALUE.BitOffset 0))
(assert (>= REG2.VALUE.BitWidth 0))
(assert (<= REG2.VALUE.BitWidth 32))
(assert (<= (+ REG2.VALUE.BitOffset REG2.VALUE.BitWidth) 32))
(assert (= REG3.FD1.BitWidth PARAM1))
(assert (= REG3.FD1.BitOffset 1))
(assert (>= REG3.FD1.BitWidth 0))
(assert (= REG3.FD2.BitWidth PARAM2))
(assert (= REG3.FD2.BitOffset 20))
(assert (>= REG3.FD2.BitWidth 0))
(assert (= ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitWidth PARAM3))
(assert (= ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitOffset 24))
(assert (>= ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitWidth 0))
(assert (<= (+ REG3.FD1.BitWidth
       REG3.FD2.BitWidth
       ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitWidth)
    32))
(assert (<= (+ ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitOffset
       ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitWidth)
    32))
(assert (xor (< (- (+ REG3.FD1.BitOffset REG3.FD1.BitWidth) 1) REG3.FD2.BitOffset)
     (< (- (+ REG3.FD2.BitOffset REG3.FD2.BitWidth) 1) REG3.FD1.BitOffset)))
(assert (xor (< (- (+ REG3.FD1.BitOffset REG3.FD1.BitWidth) 1)
        ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitOffset)
     (< (- (+ ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitOffset
              ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitWidth)
           1)
        REG3.FD1.BitOffset)))
(assert (xor (< (- (+ REG3.FD2.BitOffset REG3.FD2.BitWidth) 1)
        ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitOffset)
     (< (- (+ ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitOffset
              ISBCHK.ISBCHK_ERR_TYPE.DATA_TYPE.BitWidth)
           1)
        REG3.FD2.BitOffset)))
(maximize PARAM1)
(maximize PARAM3)
(maximize PARAM2)
(maximize PARAM5)
(maximize PARAM4)
(check-sat)
(get-value ( PARAM1 PARAM2 PARAM3 PARAM4 PARAM5))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    ((PARAM1 19)
     (PARAM2 4)
     (PARAM3 8)
     (PARAM4 32)
     (PARAM5 32))
---*)
