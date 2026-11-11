// Ported from Z3 (src/ast/fpa/fpa2bv_rewriter.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_FPA,
  FAMILY_BASIC,
  FAMILY_USER,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_DISTINCT,
  OP_EQ,
  OP_FPA_ABS,
  OP_FPA_ADD,
  OP_FPA_DIV,
  OP_FPA_EQ,
  OP_FPA_FMA,
  OP_FPA_FP,
  OP_FPA_GE,
  OP_FPA_GT,
  OP_FPA_IS_INF,
  OP_FPA_IS_NAN,
  OP_FPA_IS_NEGATIVE,
  OP_FPA_IS_NORMAL,
  OP_FPA_IS_POSITIVE,
  OP_FPA_IS_SUBNORMAL,
  OP_FPA_IS_ZERO,
  OP_FPA_LE,
  OP_FPA_LT,
  OP_FPA_MAX,
  OP_FPA_MAX_I,
  OP_FPA_MIN,
  OP_FPA_MIN_I,
  OP_FPA_MINUS_INF,
  OP_FPA_MINUS_ZERO,
  OP_FPA_MUL,
  OP_FPA_NAN,
  OP_FPA_NEG,
  OP_FPA_NUM,
  OP_FPA_PLUS_INF,
  OP_FPA_PLUS_ZERO,
  OP_FPA_REM,
  OP_FPA_RM_NEAREST_TIES_TO_AWAY,
  OP_FPA_RM_NEAREST_TIES_TO_EVEN,
  OP_FPA_RM_TOWARD_NEGATIVE,
  OP_FPA_RM_TOWARD_POSITIVE,
  OP_FPA_RM_TOWARD_ZERO,
  OP_FPA_ROUND_TO_INTEGRAL,
  OP_FPA_SQRT,
  OP_FPA_SUB,
  OP_FPA_TO_FP,
  OP_FPA_TO_FP_UNSIGNED,
  OP_FPA_TO_IEEE_BV,
  OP_FPA_TO_IEEE_BV_I,
  OP_FPA_TO_REAL,
  OP_FPA_TO_REAL_I,
  OP_FPA_TO_SBV,
  OP_FPA_TO_SBV_I,
  OP_FPA_TO_UBV,
  OP_FPA_TO_UBV_I,
  OP_EXTRACT,
  OP_ITE,
  getSymbolName,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import {
  BV_RM_TIES_TO_AWAY,
  BV_RM_TIES_TO_EVEN,
  BV_RM_TO_NEGATIVE,
  BV_RM_TO_POSITIVE,
  BV_RM_TO_ZERO,
  getFpaSignature,
} from "./fpa-decl-plugin";
import type { Fpa2BvConverter } from "./fpa2bv-converter";
import type { Rewriter } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";

const RM_VALUES = new Map([
  [OP_FPA_RM_NEAREST_TIES_TO_EVEN, BV_RM_TIES_TO_EVEN],
  [OP_FPA_RM_NEAREST_TIES_TO_AWAY, BV_RM_TIES_TO_AWAY],
  [OP_FPA_RM_TOWARD_POSITIVE, BV_RM_TO_POSITIVE],
  [OP_FPA_RM_TOWARD_NEGATIVE, BV_RM_TO_NEGATIVE],
  [OP_FPA_RM_TOWARD_ZERO, BV_RM_TO_ZERO],
]);

export class Fpa2BvRewriter extends RewriterTpl {
  private numBindings = 0;

  constructor(
    manager: AstManager,
    readonly converter: Fpa2BvConverter,
  ) {
    super(manager);
  }

  private isFloat(sort: number) {
    return this.manager.isFpSort(sort) || this.manager.isRmSort(sort);
  }

  preVisit(expr: number) {
    if (this.manager.kinds[expr] === KIND_QUANTIFIER)
      this.numBindings += this.manager.getQuantifier(expr).sorts.length;
    return true;
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    this.numBindings -= data.sorts.length;
    const result = manager.mkQuantifier({
      ...data,
      sorts: data.sorts.map((sort) =>
        manager.isFpSort(sort)
          ? manager.mkBvSort(manager.getEbits(sort) + manager.getSbits(sort))
          : manager.isRmSort(sort)
            ? manager.mkBvSort(3)
            : sort,
      ),
      names: data.names.map((name, index) =>
        this.isFloat(data.sorts[index]) ? `${getSymbolName(name)}.bv` : name,
      ),
      body,
      patterns,
      noPatterns: [],
    });
    manager.incRef(result);
    return result;
  }

  reduceVar(variable: number) {
    const manager = this.manager;
    const index = manager.values[variable];
    const sort = manager.sorts[variable];
    if (index >= this.numBindings || !this.isFloat(sort)) return -1;
    return manager.withTemporaries(() => {
      if (manager.isRmSort(sort))
        return this.converter.mkBv2Rm(manager.mkVar(index, manager.mkBvSort(3)));
      const ebits = manager.getEbits(sort);
      const size = ebits + manager.getSbits(sort);
      const bv = manager.mkVar(index, manager.mkBvSort(size));
      const extract = (high: number, low: number) =>
        mkBvApp(manager, OP_EXTRACT, [bv], [high, low]);
      return this.converter.mkFp(
        extract(size - 1, size - 1),
        extract(ebits - 1, 0),
        extract(size - 2, ebits),
      );
    });
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const info = manager.funcDecls[decl];
    if (args.some((arg) => manager.kinds[arg] === KIND_VAR && this.isFloat(manager.sorts[arg])))
      throw new SmtUnsupportedError("floating-point quantifiers");
    const isFloatUf =
      info.family !== FAMILY_BASIC &&
      (this.containsFloats(info.range) ||
        info.domain.some((domain) => this.containsFloats(domain)));
    if (info.family !== FAMILY_FPA && !isFloatUf && !this.isFloatBasic(info.op, args)) return -1;
    return manager.withTemporaries(() => this.reduceFloat(decl, args, sort));
  }

  private containsFloats(sort: number): boolean {
    return (
      this.isFloat(sort) ||
      this.manager.getSortParameters(sort).some((parameter) => this.containsFloats(parameter))
    );
  }

  private isFloatBasic(op: number, args: number[]) {
    const manager = this.manager;
    if (op === OP_EQ || op === OP_DISTINCT) return this.isFloat(manager.sorts[args[0]]);
    return op === OP_ITE && this.isFloat(manager.sorts[args[1]]);
  }

  private reduceFloat(decl: number, args: number[], sort: number): number {
    const manager = this.manager;
    const converter = this.converter;
    const info = manager.funcDecls[decl];
    const getRm = () => manager.getArg(args[0], 0);
    if (args.length === 0 && info.family === FAMILY_USER && this.isFloat(sort))
      return manager.isFpSort(sort) ? converter.mkConst(decl) : converter.mkRmConst(decl);
    switch (info.op) {
      case OP_EQ:
        return manager.isFpSort(manager.sorts[args[0]])
          ? converter.mkEq(args[0], args[1])
          : manager.mkEq(args[0], args[1]);
      case OP_ITE:
        return converter.mkIte(args[0], args[1], args[2]);
      case OP_DISTINCT:
        return converter.mkDistinct(args);
    }
    if (info.family !== FAMILY_FPA) return converter.mkUf(decl, args);
    const rm = RM_VALUES.get(info.op);
    if (rm !== undefined) return converter.mkRoundingMode(rm);
    switch (info.op) {
      case OP_FPA_NUM:
        return converter.mkNumeralOf(manager.mkApp(decl, args, sort));
      case OP_FPA_PLUS_INF:
        return converter.mkPinf(sort);
      case OP_FPA_MINUS_INF:
        return converter.mkNinf(sort);
      case OP_FPA_PLUS_ZERO:
        return converter.mkPzero(sort);
      case OP_FPA_MINUS_ZERO:
        return converter.mkNzero(sort);
      case OP_FPA_NAN:
        return converter.mkNan(sort);
      case OP_FPA_ADD: {
        const isSwapped = manager.ids[args[2]] < manager.ids[args[1]];
        return converter.mkAdd(
          sort,
          getRm(),
          isSwapped ? args[2] : args[1],
          isSwapped ? args[1] : args[2],
        );
      }
      case OP_FPA_SUB:
        return converter.mkSub(sort, getRm(), args[1], args[2]);
      case OP_FPA_NEG:
        return converter.mkNeg(args[0]);
      case OP_FPA_MUL:
        return converter.mkMul(sort, getRm(), args[1], args[2]);
      case OP_FPA_DIV:
        return converter.mkDiv(sort, getRm(), args[1], args[2]);
      case OP_FPA_REM:
        return converter.mkRem(sort, args[0], args[1]);
      case OP_FPA_ABS:
        return converter.mkAbs(args[0]);
      case OP_FPA_MIN:
        return converter.mkMinMax(decl, args, false);
      case OP_FPA_MAX:
        return converter.mkMinMax(decl, args, true);
      case OP_FPA_MIN_I:
        return converter.mkMinMaxI(OP_FPA_MIN, args);
      case OP_FPA_MAX_I:
        return converter.mkMinMaxI(OP_FPA_MAX, args);
      case OP_FPA_FMA:
        return converter.mkFma(sort, getRm(), args[1], args[2], args[3]);
      case OP_FPA_SQRT:
        return converter.mkSqrt(sort, getRm(), args[1]);
      case OP_FPA_ROUND_TO_INTEGRAL:
        return converter.mkRoundToIntegral(sort, getRm(), args[1]);
      case OP_FPA_EQ:
        return converter.mkFloatEq(args[0], args[1]);
      case OP_FPA_LT:
        return converter.mkFloatLt(args[0], args[1]);
      case OP_FPA_GT:
        return converter.mkFloatGt(args[0], args[1]);
      case OP_FPA_LE:
        return converter.mkFloatLe(args[0], args[1]);
      case OP_FPA_GE:
        return converter.mkFloatGe(args[0], args[1]);
      case OP_FPA_IS_ZERO:
        return converter.mkIsZero(args[0]);
      case OP_FPA_IS_NAN:
        return converter.mkIsNan(args[0]);
      case OP_FPA_IS_INF:
        return converter.mkIsInf(args[0]);
      case OP_FPA_IS_NORMAL:
        return converter.mkIsNormal(args[0]);
      case OP_FPA_IS_SUBNORMAL:
        return converter.mkIsDenormal(args[0]);
      case OP_FPA_IS_POSITIVE:
        return converter.mkIsPositive(args[0]);
      case OP_FPA_IS_NEGATIVE:
        return converter.mkIsNegative(args[0]);
      case OP_FPA_TO_FP:
        return converter.mkToFp(sort, args);
      case OP_FPA_TO_FP_UNSIGNED:
        return converter.mkToFpUnsigned(sort, getRm(), args[1]);
      case OP_FPA_FP:
        return converter.mkFp(args[0], args[1], args[2]);
      case OP_FPA_TO_UBV:
      case OP_FPA_TO_SBV:
        return converter.mkToBv(decl, args[0], args[1], info.op === OP_FPA_TO_SBV);
      case OP_FPA_TO_UBV_I:
      case OP_FPA_TO_SBV_I: {
        const op = info.op === OP_FPA_TO_SBV_I ? OP_FPA_TO_SBV : OP_FPA_TO_UBV;
        return converter.mkToBv(
          this.getDecl(op, info.parameters, args),
          args[0],
          args[1],
          op === OP_FPA_TO_SBV,
        );
      }
      case OP_FPA_TO_REAL:
      case OP_FPA_TO_REAL_I:
        return converter.mkToReal();
      case OP_FPA_TO_IEEE_BV:
        return converter.mkToIeeeBv(decl, args[0]);
      case OP_FPA_TO_IEEE_BV_I:
        return converter.mkToIeeeBv(this.getDecl(OP_FPA_TO_IEEE_BV, [], args), args[0]);
      default:
        return -1;
    }
  }

  private getDecl(op: number, parameters: number[], args: number[]) {
    const manager = this.manager;
    const signature = getFpaSignature(
      manager,
      op,
      parameters,
      args.map((arg) => manager.sorts[arg]),
    );
    if (typeof signature === "string") throw new SmtUnsupportedError(signature);
    return manager.mkFpaDecl(
      signature.op,
      signature.name,
      signature.parameters,
      signature.domain,
      signature.range,
    );
  }

  // The result comes with a reference, which the caller releases.
  convert(theoryRewriter: Rewriter, expr: number) {
    const manager = this.manager;
    const sort = manager.sorts[expr];
    if (manager.getOp(expr) === OP_FPA_FP) {
      manager.incRef(expr);
      return expr;
    }
    if (!manager.isFpSort(sort) && !manager.isRmSort(sort)) {
      const converted = this.rewrite(expr);
      const result = theoryRewriter.rewrite(converted);
      manager.decRef(converted);
      return result;
    }
    const converted = this.rewrite(expr);
    const result = manager.withTemporaries(() => {
      if (manager.isRmSort(sort)) {
        const bvRm = theoryRewriter.rewrite(manager.getArg(converted, 0));
        manager.releaseLater(bvRm);
        return this.converter.mkBv2Rm(bvRm);
      }
      const parts = this.converter.splitFp(converted).map((part) => {
        const rewritten = theoryRewriter.rewrite(part);
        manager.releaseLater(rewritten);
        return rewritten;
      });
      return this.converter.mkFp(parts[0], parts[1], parts[2]);
    });
    manager.decRef(converted);
    return result;
  }
}
