"use strict";
/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Live2DCubismFramework = exports.PhysicsOutput = exports.Options = exports.CubismPhysics = void 0;
var cubismmath_1 = require("../math/cubismmath");
var cubismvector2_1 = require("../math/cubismvector2");
var csmvector_1 = require("../type/csmvector");
var cubismphysicsinternal_1 = require("./cubismphysicsinternal");
var cubismphysicsjson_1 = require("./cubismphysicsjson");
// physics types tags.
var PhysicsTypeTagX = 'X';
var PhysicsTypeTagY = 'Y';
var PhysicsTypeTagAngle = 'Angle';
// Constant of air resistance.
var AirResistance = 5.0;
// Constant of maximum weight of input and output ratio.
var MaximumWeight = 100.0;
// Constant of threshold of movement.
var MovementThreshold = 0.001;
// Constant of maximum allowed delta time
var MaxDeltaTime = 5.0;
/**
 * 物理演算クラス
 */
var CubismPhysics = /** @class */ (function () {
    /**
     * コンストラクタ
     */
    function CubismPhysics() {
        this._physicsRig = null;
        // set default options
        this._options = new Options();
        this._options.gravity.y = -1.0;
        this._options.gravity.x = 0.0;
        this._options.wind.x = 0.0;
        this._options.wind.y = 0.0;
        this._currentRigOutputs = new csmvector_1.csmVector();
        this._previousRigOutputs = new csmvector_1.csmVector();
        this._currentRemainTime = 0.0;
        this._parameterCaches = null;
        this._parameterInputCaches = null;
    }
    /**
     * インスタンスの作成
     * @param buffer    physics3.jsonが読み込まれているバッファ
     * @param size      バッファのサイズ
     * @return 作成されたインスタンス
     */
    CubismPhysics.create = function (buffer, size) {
        var ret = new CubismPhysics();
        ret.parse(buffer, size);
        ret._physicsRig.gravity.y = 0;
        return ret;
    };
    /**
     * インスタンスを破棄する
     * @param physics 破棄するインスタンス
     */
    CubismPhysics.delete = function (physics) {
        if (physics != null) {
            physics.release();
            physics = null;
        }
    };
    /**
     * physics3.jsonをパースする。
     * @param physicsJson physics3.jsonが読み込まれているバッファ
     * @param size バッファのサイズ
     */
    CubismPhysics.prototype.parse = function (physicsJson, size) {
        this._physicsRig = new cubismphysicsinternal_1.CubismPhysicsRig();
        var json = new cubismphysicsjson_1.CubismPhysicsJson(physicsJson, size);
        this._physicsRig.gravity = json.getGravity();
        this._physicsRig.wind = json.getWind();
        this._physicsRig.subRigCount = json.getSubRigCount();
        this._physicsRig.fps = json.getFps();
        this._physicsRig.settings.updateSize(this._physicsRig.subRigCount, cubismphysicsinternal_1.CubismPhysicsSubRig, true);
        this._physicsRig.inputs.updateSize(json.getTotalInputCount(), cubismphysicsinternal_1.CubismPhysicsInput, true);
        this._physicsRig.outputs.updateSize(json.getTotalOutputCount(), cubismphysicsinternal_1.CubismPhysicsOutput, true);
        this._physicsRig.particles.updateSize(json.getVertexCount(), cubismphysicsinternal_1.CubismPhysicsParticle, true);
        this._currentRigOutputs.clear();
        this._previousRigOutputs.clear();
        var inputIndex = 0, outputIndex = 0, particleIndex = 0;
        for (var i = 0; i < this._physicsRig.settings.getSize(); ++i) {
            this._physicsRig.settings.at(i).normalizationPosition.minimum =
                json.getNormalizationPositionMinimumValue(i);
            this._physicsRig.settings.at(i).normalizationPosition.maximum =
                json.getNormalizationPositionMaximumValue(i);
            this._physicsRig.settings.at(i).normalizationPosition.defalut =
                json.getNormalizationPositionDefaultValue(i);
            this._physicsRig.settings.at(i).normalizationAngle.minimum =
                json.getNormalizationAngleMinimumValue(i);
            this._physicsRig.settings.at(i).normalizationAngle.maximum =
                json.getNormalizationAngleMaximumValue(i);
            this._physicsRig.settings.at(i).normalizationAngle.defalut =
                json.getNormalizationAngleDefaultValue(i);
            // Input
            this._physicsRig.settings.at(i).inputCount = json.getInputCount(i);
            this._physicsRig.settings.at(i).baseInputIndex = inputIndex;
            for (var j = 0; j < this._physicsRig.settings.at(i).inputCount; ++j) {
                this._physicsRig.inputs.at(inputIndex + j).sourceParameterIndex = -1;
                this._physicsRig.inputs.at(inputIndex + j).weight = json.getInputWeight(i, j);
                this._physicsRig.inputs.at(inputIndex + j).reflect =
                    json.getInputReflect(i, j);
                if (json.getInputType(i, j) == PhysicsTypeTagX) {
                    this._physicsRig.inputs.at(inputIndex + j).type =
                        cubismphysicsinternal_1.CubismPhysicsSource.CubismPhysicsSource_X;
                    this._physicsRig.inputs.at(inputIndex + j).getNormalizedParameterValue = getInputTranslationXFromNormalizedParameterValue;
                }
                else if (json.getInputType(i, j) == PhysicsTypeTagY) {
                    this._physicsRig.inputs.at(inputIndex + j).type =
                        cubismphysicsinternal_1.CubismPhysicsSource.CubismPhysicsSource_Y;
                    this._physicsRig.inputs.at(inputIndex + j).getNormalizedParameterValue = getInputTranslationYFromNormalizedParamterValue;
                }
                else if (json.getInputType(i, j) == PhysicsTypeTagAngle) {
                    this._physicsRig.inputs.at(inputIndex + j).type =
                        cubismphysicsinternal_1.CubismPhysicsSource.CubismPhysicsSource_Angle;
                    this._physicsRig.inputs.at(inputIndex + j).getNormalizedParameterValue = getInputAngleFromNormalizedParameterValue;
                }
                this._physicsRig.inputs.at(inputIndex + j).source.targetType =
                    cubismphysicsinternal_1.CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter;
                this._physicsRig.inputs.at(inputIndex + j).source.id =
                    json.getInputSourceId(i, j);
            }
            inputIndex += this._physicsRig.settings.at(i).inputCount;
            // Output
            this._physicsRig.settings.at(i).outputCount = json.getOutputCount(i);
            this._physicsRig.settings.at(i).baseOutputIndex = outputIndex;
            var currentRigOutput = new PhysicsOutput();
            currentRigOutput.outputs.resize(this._physicsRig.settings.at(i).outputCount);
            var previousRigOutput = new PhysicsOutput();
            previousRigOutput.outputs.resize(this._physicsRig.settings.at(i).outputCount);
            for (var j = 0; j < this._physicsRig.settings.at(i).outputCount; ++j) {
                // initialize
                currentRigOutput.outputs[j] = 0.0;
                previousRigOutput.outputs[j] = 0.0;
                this._physicsRig.outputs.at(outputIndex + j).destinationParameterIndex =
                    -1;
                this._physicsRig.outputs.at(outputIndex + j).vertexIndex =
                    json.getOutputVertexIndex(i, j);
                this._physicsRig.outputs.at(outputIndex + j).angleScale =
                    json.getOutputAngleScale(i, j);
                this._physicsRig.outputs.at(outputIndex + j).weight =
                    json.getOutputWeight(i, j);
                this._physicsRig.outputs.at(outputIndex + j).destination.targetType =
                    cubismphysicsinternal_1.CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter;
                this._physicsRig.outputs.at(outputIndex + j).destination.id =
                    json.getOutputDestinationId(i, j);
                if (json.getOutputType(i, j) == PhysicsTypeTagX) {
                    this._physicsRig.outputs.at(outputIndex + j).type =
                        cubismphysicsinternal_1.CubismPhysicsSource.CubismPhysicsSource_X;
                    this._physicsRig.outputs.at(outputIndex + j).getValue =
                        getOutputTranslationX;
                    this._physicsRig.outputs.at(outputIndex + j).getScale =
                        getOutputScaleTranslationX;
                }
                else if (json.getOutputType(i, j) == PhysicsTypeTagY) {
                    this._physicsRig.outputs.at(outputIndex + j).type =
                        cubismphysicsinternal_1.CubismPhysicsSource.CubismPhysicsSource_Y;
                    this._physicsRig.outputs.at(outputIndex + j).getValue =
                        getOutputTranslationY;
                    this._physicsRig.outputs.at(outputIndex + j).getScale =
                        getOutputScaleTranslationY;
                }
                else if (json.getOutputType(i, j) == PhysicsTypeTagAngle) {
                    this._physicsRig.outputs.at(outputIndex + j).type =
                        cubismphysicsinternal_1.CubismPhysicsSource.CubismPhysicsSource_Angle;
                    this._physicsRig.outputs.at(outputIndex + j).getValue =
                        getOutputAngle;
                    this._physicsRig.outputs.at(outputIndex + j).getScale =
                        getOutputScaleAngle;
                }
                this._physicsRig.outputs.at(outputIndex + j).reflect =
                    json.getOutputReflect(i, j);
            }
            this._currentRigOutputs.pushBack(currentRigOutput);
            this._previousRigOutputs.pushBack(previousRigOutput);
            outputIndex += this._physicsRig.settings.at(i).outputCount;
            // Particle
            this._physicsRig.settings.at(i).particleCount = json.getParticleCount(i);
            this._physicsRig.settings.at(i).baseParticleIndex = particleIndex;
            for (var j = 0; j < this._physicsRig.settings.at(i).particleCount; ++j) {
                this._physicsRig.particles.at(particleIndex + j).mobility =
                    json.getParticleMobility(i, j);
                this._physicsRig.particles.at(particleIndex + j).delay =
                    json.getParticleDelay(i, j);
                this._physicsRig.particles.at(particleIndex + j).acceleration =
                    json.getParticleAcceleration(i, j);
                this._physicsRig.particles.at(particleIndex + j).radius =
                    json.getParticleRadius(i, j);
                this._physicsRig.particles.at(particleIndex + j).position =
                    json.getParticlePosition(i, j);
            }
            particleIndex += this._physicsRig.settings.at(i).particleCount;
        }
        this.initialize();
        json.release();
        json = void 0;
        json = null;
    };
    /**
     * 現在のパラメータ値で物理演算が安定化する状態を演算する。
     * @param model 物理演算の結果を適用するモデル
     */
    CubismPhysics.prototype.stabilization = function (model) {
        var _a, _b, _c, _d;
        var totalAngle;
        var weight;
        var radAngle;
        var outputValue;
        var totalTranslation = new cubismvector2_1.CubismVector2();
        var currentSetting;
        var currentInputs;
        var currentOutputs;
        var currentParticles;
        var parameterValues;
        var parameterMaximumValues;
        var parameterMinimumValues;
        var parameterDefaultValues;
        parameterValues = model.getModel().parameters.values;
        parameterMaximumValues = model.getModel().parameters.maximumValues;
        parameterMinimumValues = model.getModel().parameters.minimumValues;
        parameterDefaultValues = model.getModel().parameters.defaultValues;
        if (((_b = (_a = this._parameterCaches) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) < model.getParameterCount()) {
            this._parameterCaches = new Float32Array(model.getParameterCount());
        }
        if (((_d = (_c = this._parameterInputCaches) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) < model.getParameterCount()) {
            this._parameterInputCaches = new Float32Array(model.getParameterCount());
        }
        for (var j = 0; j < model.getParameterCount(); ++j) {
            this._parameterCaches[j] = parameterValues[j];
            this._parameterInputCaches[j] = parameterValues[j];
        }
        for (var settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
            totalAngle = { angle: 0.0 };
            totalTranslation.x = 0.0;
            totalTranslation.y = 0.0;
            currentSetting = this._physicsRig.settings.at(settingIndex);
            currentInputs = this._physicsRig.inputs.get(currentSetting.baseInputIndex);
            currentOutputs = this._physicsRig.outputs.get(currentSetting.baseOutputIndex);
            currentParticles = this._physicsRig.particles.get(currentSetting.baseParticleIndex);
            // Load input parameters
            for (var i = 0; i < currentSetting.inputCount; ++i) {
                weight = currentInputs[i].weight / MaximumWeight;
                if (currentInputs[i].sourceParameterIndex == -1) {
                    currentInputs[i].sourceParameterIndex = model.getParameterIndex(currentInputs[i].source.id);
                }
                currentInputs[i].getNormalizedParameterValue(totalTranslation, totalAngle, parameterValues[currentInputs[i].sourceParameterIndex], parameterMinimumValues[currentInputs[i].sourceParameterIndex], parameterMaximumValues[currentInputs[i].sourceParameterIndex], parameterDefaultValues[currentInputs[i].sourceParameterIndex], currentSetting.normalizationPosition, currentSetting.normalizationAngle, currentInputs[i].reflect, weight);
                this._parameterCaches[currentInputs[i].sourceParameterIndex] =
                    parameterValues[currentInputs[i].sourceParameterIndex];
            }
            radAngle = cubismmath_1.CubismMath.degreesToRadian(-totalAngle.angle);
            totalTranslation.x =
                totalTranslation.x * cubismmath_1.CubismMath.cos(radAngle) -
                    totalTranslation.y * cubismmath_1.CubismMath.sin(radAngle);
            totalTranslation.y =
                totalTranslation.x * cubismmath_1.CubismMath.sin(radAngle) +
                    totalTranslation.y * cubismmath_1.CubismMath.cos(radAngle);
            // Calculate particles position.
            updateParticlesForStabilization(currentParticles, currentSetting.particleCount, totalTranslation, totalAngle.angle, this._options.wind, MovementThreshold * currentSetting.normalizationPosition.maximum);
            // Update output parameters.
            for (var i = 0; i < currentSetting.outputCount; ++i) {
                var particleIndex = currentOutputs[i].vertexIndex;
                if (currentOutputs[i].destinationParameterIndex == -1) {
                    currentOutputs[i].destinationParameterIndex = model.getParameterIndex(currentOutputs[i].destination.id);
                }
                if (particleIndex < 1 ||
                    particleIndex >= currentSetting.particleCount) {
                    continue;
                }
                var translation = new cubismvector2_1.CubismVector2();
                translation = currentParticles[particleIndex].position.substract(currentParticles[particleIndex - 1].position);
                outputValue = currentOutputs[i].getValue(translation, currentParticles, particleIndex, currentOutputs[i].reflect, this._options.gravity);
                this._currentRigOutputs.at(settingIndex).outputs[i] = outputValue;
                this._previousRigOutputs.at(settingIndex).outputs[i] = outputValue;
                var destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
                var outParameterCaches = !Float32Array.prototype.slice && 'subarray' in Float32Array.prototype
                    ? JSON.parse(JSON.stringify(parameterValues.subarray(destinationParameterIndex))) // 値渡しするため、JSON.parse, JSON.stringify
                    : parameterValues.slice(destinationParameterIndex);
                updateOutputParameterValue(outParameterCaches, parameterMinimumValues[destinationParameterIndex], parameterMaximumValues[destinationParameterIndex], outputValue, currentOutputs[i]);
                // 値を反映
                for (var offset = destinationParameterIndex, outParamIndex = 0; offset < this._parameterCaches.length; offset++, outParamIndex++) {
                    parameterValues[offset] = this._parameterCaches[offset] =
                        outParameterCaches[outParamIndex];
                }
            }
        }
    };
    /**
     * 物理演算の評価
     *
     * Pendulum interpolation weights
     *
     * 振り子の計算結果は保存され、パラメータへの出力は保存された前回の結果で補間されます。
     * The result of the pendulum calculation is saved and
     * the output to the parameters is interpolated with the saved previous result of the pendulum calculation.
     *
     * 図で示すと[1]と[2]で補間されます。
     * The figure shows the interpolation between [1] and [2].
     *
     * 補間の重みは最新の振り子計算タイミングと次回のタイミングの間で見た現在時間で決定する。
     * The weight of the interpolation are determined by the current time seen between
     * the latest pendulum calculation timing and the next timing.
     *
     * 図で示すと[2]と[4]の間でみた(3)の位置の重みになる。
     * Figure shows the weight of position (3) as seen between [2] and [4].
     *
     * 解釈として振り子計算のタイミングと重み計算のタイミングがズレる。
     * As an interpretation, the pendulum calculation and weights are misaligned.
     *
     * physics3.jsonにFPS情報が存在しない場合は常に前の振り子状態で設定される。
     * If there is no FPS information in physics3.json, it is always set in the previous pendulum state.
     *
     * この仕様は補間範囲を逸脱したことが原因の震えたような見た目を回避を目的にしている。
     * The purpose of this specification is to avoid the quivering appearance caused by deviations from the interpolation range.
     *
     * ------------ time -------------->
     *
     *                 |+++++|------| <- weight
     * ==[1]====#=====[2]---(3)----(4)
     *          ^ output contents
     *
     * 1:_previousRigOutputs
     * 2:_currentRigOutputs
     * 3:_currentRemainTime (now rendering)
     * 4:next particles timing
     * @param model 物理演算の結果を適用するモデル
     * @param deltaTimeSeconds デルタ時間[秒]
     */
    CubismPhysics.prototype.evaluate = function (model, deltaTimeSeconds) {
        var _a, _b, _c, _d;
        var totalAngle;
        var weight;
        var radAngle;
        var outputValue;
        var totalTranslation = new cubismvector2_1.CubismVector2();
        var currentSetting;
        var currentInputs;
        var currentOutputs;
        var currentParticles;
        if (0.0 >= deltaTimeSeconds) {
            return;
        }
        var parameterValues;
        var parameterMaximumValues;
        var parameterMinimumValues;
        var parameterDefaultValues;
        var physicsDeltaTime;
        this._currentRemainTime += deltaTimeSeconds;
        if (this._currentRemainTime > MaxDeltaTime) {
            this._currentRemainTime = 0.0;
        }
        parameterValues = model.getModel().parameters.values;
        parameterMaximumValues = model.getModel().parameters.maximumValues;
        parameterMinimumValues = model.getModel().parameters.minimumValues;
        parameterDefaultValues = model.getModel().parameters.defaultValues;
        if (((_b = (_a = this._parameterCaches) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) < model.getParameterCount()) {
            this._parameterCaches = new Float32Array(model.getParameterCount());
        }
        if (((_d = (_c = this._parameterInputCaches) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) < model.getParameterCount()) {
            this._parameterInputCaches = new Float32Array(model.getParameterCount());
            for (var j = 0; j < model.getParameterCount(); ++j) {
                this._parameterInputCaches[j] = parameterValues[j];
            }
        }
        if (this._physicsRig.fps > 0.0) {
            physicsDeltaTime = 1.0 / this._physicsRig.fps;
        }
        else {
            physicsDeltaTime = deltaTimeSeconds;
        }
        while (this._currentRemainTime >= physicsDeltaTime) {
            // copyRigOutputs _currentRigOutputs to _previousRigOutputs
            for (var settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
                currentSetting = this._physicsRig.settings.at(settingIndex);
                currentOutputs = this._physicsRig.outputs.get(currentSetting.baseOutputIndex);
                for (var i = 0; i < currentSetting.outputCount; ++i) {
                    this._previousRigOutputs.at(settingIndex).outputs[i] =
                        this._currentRigOutputs.at(settingIndex).outputs[i];
                }
            }
            // 入力キャッシュとパラメータで線形補間してUpdateParticlesするタイミングでの入力を計算する。
            // Calculate the input at the timing to UpdateParticles by linear interpolation with the _parameterInputCache and parameterValue.
            // _parameterCacheはグループ間での値の伝搬の役割があるので_parameterInputCacheとの分離が必要。
            // _parameterCache needs to be separated from _parameterInputCache because of its role in propagating values between groups.
            var inputWeight = physicsDeltaTime / this._currentRemainTime;
            for (var j = 0; j < model.getParameterCount(); ++j) {
                this._parameterCaches[j] =
                    this._parameterInputCaches[j] * (1.0 - inputWeight) +
                        parameterValues[j] * inputWeight;
                this._parameterInputCaches[j] = this._parameterCaches[j];
            }
            for (var settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
                totalAngle = { angle: 0.0 };
                totalTranslation.x = 0.0;
                totalTranslation.y = 0.0;
                currentSetting = this._physicsRig.settings.at(settingIndex);
                currentInputs = this._physicsRig.inputs.get(currentSetting.baseInputIndex);
                currentOutputs = this._physicsRig.outputs.get(currentSetting.baseOutputIndex);
                currentParticles = this._physicsRig.particles.get(currentSetting.baseParticleIndex);
                // Load input parameters
                for (var i = 0; i < currentSetting.inputCount; ++i) {
                    weight = currentInputs[i].weight / MaximumWeight;
                    if (currentInputs[i].sourceParameterIndex == -1) {
                        currentInputs[i].sourceParameterIndex = model.getParameterIndex(currentInputs[i].source.id);
                    }
                    currentInputs[i].getNormalizedParameterValue(totalTranslation, totalAngle, this._parameterCaches[currentInputs[i].sourceParameterIndex], parameterMinimumValues[currentInputs[i].sourceParameterIndex], parameterMaximumValues[currentInputs[i].sourceParameterIndex], parameterDefaultValues[currentInputs[i].sourceParameterIndex], currentSetting.normalizationPosition, currentSetting.normalizationAngle, currentInputs[i].reflect, weight);
                }
                radAngle = cubismmath_1.CubismMath.degreesToRadian(-totalAngle.angle);
                totalTranslation.x =
                    totalTranslation.x * cubismmath_1.CubismMath.cos(radAngle) -
                        totalTranslation.y * cubismmath_1.CubismMath.sin(radAngle);
                totalTranslation.y =
                    totalTranslation.x * cubismmath_1.CubismMath.sin(radAngle) +
                        totalTranslation.y * cubismmath_1.CubismMath.cos(radAngle);
                // Calculate particles position.
                updateParticles(currentParticles, currentSetting.particleCount, totalTranslation, totalAngle.angle, this._options.wind, MovementThreshold * currentSetting.normalizationPosition.maximum, physicsDeltaTime, AirResistance);
                // Update output parameters.
                for (var i = 0; i < currentSetting.outputCount; ++i) {
                    var particleIndex = currentOutputs[i].vertexIndex;
                    if (currentOutputs[i].destinationParameterIndex == -1) {
                        currentOutputs[i].destinationParameterIndex =
                            model.getParameterIndex(currentOutputs[i].destination.id);
                    }
                    if (particleIndex < 1 ||
                        particleIndex >= currentSetting.particleCount) {
                        continue;
                    }
                    var translation = new cubismvector2_1.CubismVector2();
                    translation.x =
                        currentParticles[particleIndex].position.x -
                            currentParticles[particleIndex - 1].position.x;
                    translation.y =
                        currentParticles[particleIndex].position.y -
                            currentParticles[particleIndex - 1].position.y;
                    outputValue = currentOutputs[i].getValue(translation, currentParticles, particleIndex, currentOutputs[i].reflect, this._options.gravity);
                    this._currentRigOutputs.at(settingIndex).outputs[i] = outputValue;
                    var destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
                    var outParameterCaches = !Float32Array.prototype.slice &&
                        'subarray' in Float32Array.prototype
                        ? JSON.parse(JSON.stringify(this._parameterCaches.subarray(destinationParameterIndex))) // 値渡しするため、JSON.parse, JSON.stringify
                        : this._parameterCaches.slice(destinationParameterIndex);
                    updateOutputParameterValue(outParameterCaches, parameterMinimumValues[destinationParameterIndex], parameterMaximumValues[destinationParameterIndex], outputValue, currentOutputs[i]);
                    // 値を反映
                    for (var offset = destinationParameterIndex, outParamIndex = 0; offset < this._parameterCaches.length; offset++, outParamIndex++) {
                        this._parameterCaches[offset] = outParameterCaches[outParamIndex];
                    }
                }
            }
            this._currentRemainTime -= physicsDeltaTime;
        }
        var alpha = this._currentRemainTime / physicsDeltaTime;
        this.interpolate(model, alpha);
    };
    /**
     * 物理演算結果の適用
     * 振り子演算の最新の結果と一つ前の結果から指定した重みで適用する。
     * @param model 物理演算の結果を適用するモデル
     * @param weight 最新結果の重み
     */
    CubismPhysics.prototype.interpolate = function (model, weight) {
        var currentOutputs;
        var currentSetting;
        var parameterValues;
        var parameterMaximumValues;
        var parameterMinimumValues;
        parameterValues = model.getModel().parameters.values;
        parameterMaximumValues = model.getModel().parameters.maximumValues;
        parameterMinimumValues = model.getModel().parameters.minimumValues;
        for (var settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
            currentSetting = this._physicsRig.settings.at(settingIndex);
            currentOutputs = this._physicsRig.outputs.get(currentSetting.baseOutputIndex);
            // Load input parameters.
            for (var i = 0; i < currentSetting.outputCount; ++i) {
                if (currentOutputs[i].destinationParameterIndex == -1) {
                    continue;
                }
                var destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
                var outParameterValues = !Float32Array.prototype.slice && 'subarray' in Float32Array.prototype
                    ? JSON.parse(JSON.stringify(parameterValues.subarray(destinationParameterIndex))) // 値渡しするため、JSON.parse, JSON.stringify
                    : parameterValues.slice(destinationParameterIndex);
                updateOutputParameterValue(outParameterValues, parameterMinimumValues[destinationParameterIndex], parameterMaximumValues[destinationParameterIndex], this._previousRigOutputs.at(settingIndex).outputs[i] * (1 - weight) +
                    this._currentRigOutputs.at(settingIndex).outputs[i] * weight, currentOutputs[i]);
                // 値を反映
                for (var offset = destinationParameterIndex, outParamIndex = 0; offset < parameterValues.length; offset++, outParamIndex++) {
                    parameterValues[offset] = outParameterValues[outParamIndex];
                }
            }
        }
    };
    /**
     * オプションの設定
     * @param options オプション
     */
    CubismPhysics.prototype.setOptions = function (options) {
        this._options = options;
    };
    /**
     * オプションの取得
     * @return オプション
     */
    CubismPhysics.prototype.getOption = function () {
        return this._options;
    };
    /**
     * デストラクタ相当の処理
     */
    CubismPhysics.prototype.release = function () {
        this._physicsRig = void 0;
        this._physicsRig = null;
    };
    /**
     * 初期化する
     */
    CubismPhysics.prototype.initialize = function () {
        var strand;
        var currentSetting;
        var radius;
        for (var settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
            currentSetting = this._physicsRig.settings.at(settingIndex);
            strand = this._physicsRig.particles.get(currentSetting.baseParticleIndex);
            // Initialize the top of particle.
            strand[0].initialPosition = new cubismvector2_1.CubismVector2(0.0, 0.0);
            strand[0].lastPosition = new cubismvector2_1.CubismVector2(strand[0].initialPosition.x, strand[0].initialPosition.y);
            strand[0].lastGravity = new cubismvector2_1.CubismVector2(0.0, -1.0);
            strand[0].lastGravity.y *= -1.0;
            strand[0].velocity = new cubismvector2_1.CubismVector2(0.0, 0.0);
            strand[0].force = new cubismvector2_1.CubismVector2(0.0, 0.0);
            // Initialize particles.
            for (var i = 1; i < currentSetting.particleCount; ++i) {
                radius = new cubismvector2_1.CubismVector2(0.0, 0.0);
                radius.y = strand[i].radius;
                strand[i].initialPosition = new cubismvector2_1.CubismVector2(strand[i - 1].initialPosition.x + radius.x, strand[i - 1].initialPosition.y + radius.y);
                strand[i].position = new cubismvector2_1.CubismVector2(strand[i].initialPosition.x, strand[i].initialPosition.y);
                strand[i].lastPosition = new cubismvector2_1.CubismVector2(strand[i].initialPosition.x, strand[i].initialPosition.y);
                strand[i].lastGravity = new cubismvector2_1.CubismVector2(0.0, -1.0);
                strand[i].lastGravity.y *= -1.0;
                strand[i].velocity = new cubismvector2_1.CubismVector2(0.0, 0.0);
                strand[i].force = new cubismvector2_1.CubismVector2(0.0, 0.0);
            }
        }
    };
    return CubismPhysics;
}());
exports.CubismPhysics = CubismPhysics;
/**
 * 物理演算のオプション
 */
var Options = /** @class */ (function () {
    function Options() {
        this.gravity = new cubismvector2_1.CubismVector2(0, 0);
        this.wind = new cubismvector2_1.CubismVector2(0, 0);
    }
    return Options;
}());
exports.Options = Options;
/**
 * パラメータに適用する前の物理演算の出力結果
 */
var PhysicsOutput = /** @class */ (function () {
    function PhysicsOutput() {
        this.outputs = new csmvector_1.csmVector(0);
    }
    return PhysicsOutput;
}());
exports.PhysicsOutput = PhysicsOutput;
/**
 * Gets sign.
 *
 * @param value Evaluation target value.
 *
 * @return Sign of value.
 */
function sign(value) {
    var ret = 0;
    if (value > 0.0) {
        ret = 1;
    }
    else if (value < 0.0) {
        ret = -1;
    }
    return ret;
}
function getInputTranslationXFromNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition, normalizationAngle, isInverted, weight) {
    targetTranslation.x +=
        normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition.minimum, normalizationPosition.maximum, normalizationPosition.defalut, isInverted) * weight;
}
function getInputTranslationYFromNormalizedParamterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition, normalizationAngle, isInverted, weight) {
    targetTranslation.y +=
        normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition.minimum, normalizationPosition.maximum, normalizationPosition.defalut, isInverted) * weight;
}
function getInputAngleFromNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizaitionPosition, normalizationAngle, isInverted, weight) {
    targetAngle.angle +=
        normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationAngle.minimum, normalizationAngle.maximum, normalizationAngle.defalut, isInverted) * weight;
}
function getOutputTranslationX(translation, particles, particleIndex, isInverted, parentGravity) {
    var outputValue = translation.x;
    if (isInverted) {
        outputValue *= -1.0;
    }
    return outputValue;
}
function getOutputTranslationY(translation, particles, particleIndex, isInverted, parentGravity) {
    var outputValue = translation.y;
    if (isInverted) {
        outputValue *= -1.0;
    }
    return outputValue;
}
function getOutputAngle(translation, particles, particleIndex, isInverted, parentGravity) {
    var outputValue;
    if (particleIndex >= 2) {
        parentGravity = particles[particleIndex - 1].position.substract(particles[particleIndex - 2].position);
    }
    else {
        parentGravity = parentGravity.multiplyByScaler(-1.0);
    }
    outputValue = cubismmath_1.CubismMath.directionToRadian(parentGravity, translation);
    if (isInverted) {
        outputValue *= -1.0;
    }
    return outputValue;
}
function getRangeValue(min, max) {
    var maxValue = cubismmath_1.CubismMath.max(min, max);
    var minValue = cubismmath_1.CubismMath.min(min, max);
    return cubismmath_1.CubismMath.abs(maxValue - minValue);
}
function getDefaultValue(min, max) {
    var minValue = cubismmath_1.CubismMath.min(min, max);
    return minValue + getRangeValue(min, max) / 2.0;
}
function getOutputScaleTranslationX(translationScale, angleScale) {
    return JSON.parse(JSON.stringify(translationScale.x));
}
function getOutputScaleTranslationY(translationScale, angleScale) {
    return JSON.parse(JSON.stringify(translationScale.y));
}
function getOutputScaleAngle(translationScale, angleScale) {
    return JSON.parse(JSON.stringify(angleScale));
}
/**
 * Updates particles.
 *
 * @param strand                Target array of particle.
 * @param strandCount           Count of particle.
 * @param totalTranslation      Total translation value.
 * @param totalAngle            Total angle.
 * @param windDirection         Direction of Wind.
 * @param thresholdValue        Threshold of movement.
 * @param deltaTimeSeconds      Delta time.
 * @param airResistance         Air resistance.
 */
function updateParticles(strand, strandCount, totalTranslation, totalAngle, windDirection, thresholdValue, deltaTimeSeconds, airResistance) {
    var totalRadian;
    var delay;
    var radian;
    var currentGravity;
    var direction = new cubismvector2_1.CubismVector2(0.0, 0.0);
    var velocity = new cubismvector2_1.CubismVector2(0.0, 0.0);
    var force = new cubismvector2_1.CubismVector2(0.0, 0.0);
    var newDirection = new cubismvector2_1.CubismVector2(0.0, 0.0);
    strand[0].position = new cubismvector2_1.CubismVector2(totalTranslation.x, totalTranslation.y);
    totalRadian = cubismmath_1.CubismMath.degreesToRadian(totalAngle);
    currentGravity = cubismmath_1.CubismMath.radianToDirection(totalRadian);
    currentGravity.normalize();
    for (var i = 1; i < strandCount; ++i) {
        strand[i].force = currentGravity
            .multiplyByScaler(strand[i].acceleration)
            .add(windDirection);
        strand[i].lastPosition = new cubismvector2_1.CubismVector2(strand[i].position.x, strand[i].position.y);
        delay = strand[i].delay * deltaTimeSeconds * 30.0;
        direction = strand[i].position.substract(strand[i - 1].position);
        radian =
            cubismmath_1.CubismMath.directionToRadian(strand[i].lastGravity, currentGravity) /
                airResistance;
        direction.x =
            cubismmath_1.CubismMath.cos(radian) * direction.x -
                direction.y * cubismmath_1.CubismMath.sin(radian);
        direction.y =
            cubismmath_1.CubismMath.sin(radian) * direction.x +
                direction.y * cubismmath_1.CubismMath.cos(radian);
        strand[i].position = strand[i - 1].position.add(direction);
        velocity = strand[i].velocity.multiplyByScaler(delay);
        force = strand[i].force.multiplyByScaler(delay).multiplyByScaler(delay);
        strand[i].position = strand[i].position.add(velocity).add(force);
        newDirection = strand[i].position.substract(strand[i - 1].position);
        newDirection.normalize();
        strand[i].position = strand[i - 1].position.add(newDirection.multiplyByScaler(strand[i].radius));
        if (cubismmath_1.CubismMath.abs(strand[i].position.x) < thresholdValue) {
            strand[i].position.x = 0.0;
        }
        if (delay != 0.0) {
            strand[i].velocity = strand[i].position.substract(strand[i].lastPosition);
            strand[i].velocity = strand[i].velocity.divisionByScalar(delay);
            strand[i].velocity = strand[i].velocity.multiplyByScaler(strand[i].mobility);
        }
        strand[i].force = new cubismvector2_1.CubismVector2(0.0, 0.0);
        strand[i].lastGravity = new cubismvector2_1.CubismVector2(currentGravity.x, currentGravity.y);
    }
}
/**
 * Updates particles for stabilization.
 *
 * @param strand                Target array of particle.
 * @param strandCount           Count of particle.
 * @param totalTranslation      Total translation value.
 * @param totalAngle            Total angle.
 * @param windDirection         Direction of Wind.
 * @param thresholdValue        Threshold of movement.
 */
function updateParticlesForStabilization(strand, strandCount, totalTranslation, totalAngle, windDirection, thresholdValue) {
    var totalRadian;
    var currentGravity;
    var force = new cubismvector2_1.CubismVector2(0.0, 0.0);
    strand[0].position = new cubismvector2_1.CubismVector2(totalTranslation.x, totalTranslation.y);
    totalRadian = cubismmath_1.CubismMath.degreesToRadian(totalAngle);
    currentGravity = cubismmath_1.CubismMath.radianToDirection(totalRadian);
    currentGravity.normalize();
    for (var i = 1; i < strandCount; ++i) {
        strand[i].force = currentGravity
            .multiplyByScaler(strand[i].acceleration)
            .add(windDirection);
        strand[i].lastPosition = new cubismvector2_1.CubismVector2(strand[i].position.x, strand[i].position.y);
        strand[i].velocity = new cubismvector2_1.CubismVector2(0.0, 0.0);
        force = strand[i].force;
        force.normalize();
        force = force.multiplyByScaler(strand[i].radius);
        strand[i].position = strand[i - 1].position.add(force);
        if (cubismmath_1.CubismMath.abs(strand[i].position.x) < thresholdValue) {
            strand[i].position.x = 0.0;
        }
        strand[i].force = new cubismvector2_1.CubismVector2(0.0, 0.0);
        strand[i].lastGravity = new cubismvector2_1.CubismVector2(currentGravity.x, currentGravity.y);
    }
}
/**
 * Updates output parameter value.
 * @param parameterValue            Target parameter value.
 * @param parameterValueMinimum     Minimum of parameter value.
 * @param parameterValueMaximum     Maximum of parameter value.
 * @param translation               Translation value.
 */
function updateOutputParameterValue(parameterValue, parameterValueMinimum, parameterValueMaximum, translation, output) {
    var outputScale;
    var value;
    var weight;
    outputScale = output.getScale(output.translationScale, output.angleScale);
    value = translation * outputScale;
    if (value < parameterValueMinimum) {
        if (value < output.valueBelowMinimum) {
            output.valueBelowMinimum = value;
        }
        value = parameterValueMinimum;
    }
    else if (value > parameterValueMaximum) {
        if (value > output.valueExceededMaximum) {
            output.valueExceededMaximum = value;
        }
        value = parameterValueMaximum;
    }
    weight = output.weight / MaximumWeight;
    if (weight >= 1.0) {
        parameterValue[0] = value;
    }
    else {
        value = parameterValue[0] * (1.0 - weight) + value * weight;
        parameterValue[0] = value;
    }
}
function normalizeParameterValue(value, parameterMinimum, parameterMaximum, parameterDefault, normalizedMinimum, normalizedMaximum, normalizedDefault, isInverted) {
    var result = 0.0;
    var maxValue = cubismmath_1.CubismMath.max(parameterMaximum, parameterMinimum);
    if (maxValue < value) {
        value = maxValue;
    }
    var minValue = cubismmath_1.CubismMath.min(parameterMaximum, parameterMinimum);
    if (minValue > value) {
        value = minValue;
    }
    var minNormValue = cubismmath_1.CubismMath.min(normalizedMinimum, normalizedMaximum);
    var maxNormValue = cubismmath_1.CubismMath.max(normalizedMinimum, normalizedMaximum);
    var middleNormValue = normalizedDefault;
    var middleValue = getDefaultValue(minValue, maxValue);
    var paramValue = value - middleValue;
    switch (sign(paramValue)) {
        case 1: {
            var nLength = maxNormValue - middleNormValue;
            var pLength = maxValue - middleValue;
            if (pLength != 0.0) {
                result = paramValue * (nLength / pLength);
                result += middleNormValue;
            }
            break;
        }
        case -1: {
            var nLength = minNormValue - middleNormValue;
            var pLength = minValue - middleValue;
            if (pLength != 0.0) {
                result = paramValue * (nLength / pLength);
                result += middleNormValue;
            }
            break;
        }
        case 0: {
            result = middleNormValue;
            break;
        }
        default: {
            break;
        }
    }
    return isInverted ? result : result * -1.0;
}
// Namespace definition for compatibility.
var $ = __importStar(require("./cubismphysics"));
// eslint-disable-next-line @typescript-eslint/no-namespace
var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismPhysics = $.CubismPhysics;
    Live2DCubismFramework.Options = $.Options;
})(Live2DCubismFramework = exports.Live2DCubismFramework || (exports.Live2DCubismFramework = {}));
//# sourceMappingURL=cubismphysics.js.map